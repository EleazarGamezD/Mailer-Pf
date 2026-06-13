import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

import { getDatabase } from '../../config/db.js';
import { ContentCollectionEnum } from '../../core/enums/content-collection.enum.js';
import { DatabaseCollectionEnum } from '../../core/enums/database-collection.enum.js';
import { ProfileKeyEnum } from '../../core/enums/profile-key.enum.js';
import type { ContentDocument, ExperiencePeriod, ProfileDocument } from '../../core/interfaces/domain.js';

type Lang = 'es' | 'en';

interface CvPdfResult {
  buffer: Buffer;
  fileName: string;
}

interface CvExperienceEntry {
  company: string;
  title: string;
  period: string;
  descriptionLines: string[];
  skills: string[];
}

interface CvEducationEntry {
  institution: string;
  degree: string;
  period: string;
  descriptionLines: string[];
  href: string;
}

interface CvCertificationEntry {
  name: string;
  issuer: string;
  issuedAt: string;
  credentialId: string;
  href: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, '../../assets/templates/cv-ats.html');

function getText(obj: { es?: string; en?: string } | undefined, lang: Lang): string {
  if (!obj) return '';
  return (lang === 'es' ? obj.es : obj.en) || obj.es || obj.en || '';
}

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

function metaStr(metadata: Record<string, unknown> | undefined | null, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function metaStringArray(metadata: Record<string, unknown> | undefined | null, key: string): string[] {
  const value = metadata?.[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];
}

function splitMultilineText(value: string): string[] {
  return value
    .split(/\n+/u)
    .map((line) => normalizeText(line.replace(/^[-*]\s*/u, '')))
    .filter(Boolean);
}

function formatPeriod(period: ExperiencePeriod | undefined | null, lang: Lang): string {
  if (!period?.start) return '';
  const currentLabel = lang === 'es' ? 'Actual' : 'Present';
  if (period.current || !period.end) {
    return `${period.start} - ${currentLabel}`;
  }
  return `${period.start} - ${period.end}`;
}

function makeDownloadFileName(fullName: string, lang: Lang): string {
  const normalizedName = normalizeText(fullName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^a-zA-Z0-9\s_-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  const [firstName = 'portfolio', ...rest] = normalizedName.split(' ');
  const lastName = rest.at(-1) || 'owner';

  return `${firstName}_${lastName}_${lang}_cv.pdf`;
}

function renderListItems(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderContactItem(value: string, href?: string): string {
  if (!value) return '';
  const safeValue = escapeHtml(value);
  if (!href) return `<li>${safeValue}</li>`;
  return `<li><a href="${escapeHtml(href)}">${safeValue}</a></li>`;
}

function replaceTemplateTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/gu, (_match, key: string) => tokens[key] ?? '');
}

function renderSection(title: string, body: string): string {
  if (!body.trim()) return '';
  return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function renderSkillGroups(groupedSkills: Map<string, string[]>, allSkillNames: string[], lang: Lang): string {
  const groupLabels: Record<string, { es: string; en: string }> = {
    languages: { es: 'Lenguajes', en: 'Languages' },
    language: { es: 'Lenguajes', en: 'Languages' },
    backend: { es: 'Backend', en: 'Backend' },
    frontend: { es: 'Frontend', en: 'Frontend' },
    database: { es: 'Base de datos', en: 'Database' },
    databases: { es: 'Base de datos', en: 'Database' },
    devops: { es: 'DevOps', en: 'DevOps' },
    tools: { es: 'Herramientas y extras', en: 'Tools and extras' },
    extras: { es: 'Herramientas y extras', en: 'Tools and extras' },
  };

  const categorizedEntries = [...groupedSkills.entries()].filter(([groupName]) => Boolean(groupName));
  if (categorizedEntries.length === 0) {
    return `<p>${escapeHtml(allSkillNames.join(', '))}</p>`;
  }

  const html = categorizedEntries
    .map(([groupName, skills]) => {
      const normalizedGroupKey = groupName.trim().toLowerCase();
      const translatedLabel = groupLabels[normalizedGroupKey];
      const displayLabel = translatedLabel ? translatedLabel[lang] : groupName;
      return `<p class="skill-group"><strong>${escapeHtml(displayLabel)}:</strong> ${escapeHtml(skills.join(', '))}</p>`;
    })
    .join('');

  const uncategorizedItems = groupedSkills.get('') || [];
  if (uncategorizedItems.length === 0) {
    return html;
  }

  return `${html}<p class="skill-group"><strong>${lang === 'es' ? 'Otros' : 'Other'}:</strong> ${escapeHtml(uncategorizedItems.join(', '))}</p>`;
}

function renderExperience(entries: CvExperienceEntry[], lang: Lang): string {
  return entries
    .map((entry) => {
      const roleTitle = entry.title && entry.title !== entry.company ? entry.title : '';
      const header = [
        `<h3>${escapeHtml(entry.company)}</h3>`,
        '<div class="role-meta">',
        roleTitle ? `<span class="position">${escapeHtml(roleTitle)}</span>` : '<span></span>',
        entry.period ? `<span class="period">${escapeHtml(entry.period)}</span>` : '',
        '</div>',
      ].join('');
      const bullets = entry.descriptionLines.length > 0 ? `<ul>${renderListItems(entry.descriptionLines)}</ul>` : '';
      const techStack = entry.skills.length > 0
        ? `<p class="tech-stack"><strong>${lang === 'es' ? 'Stack usado' : 'Tech stack'}:</strong> ${escapeHtml(entry.skills.join(', '))}</p>`
        : '';

      return `<article class="role">${header}${bullets}${techStack}</article>`;
    })
    .join('');
}

function renderEducation(entries: CvEducationEntry[], lang: Lang): string {
  return entries
    .map((entry) => {
      const degree = entry.degree && entry.degree !== entry.institution ? entry.degree : '';
      const header = [
        `<h3>${escapeHtml(entry.institution)}</h3>`,
        '<div class="role-meta">',
        degree ? `<span class="position">${escapeHtml(degree)}</span>` : '<span></span>',
        entry.period ? `<span class="period">${escapeHtml(entry.period)}</span>` : '',
        '</div>',
      ].join('');
      const bullets = entry.descriptionLines.length > 0 ? `<ul>${renderListItems(entry.descriptionLines)}</ul>` : '';
      const link = entry.href
        ? `<p class="tech-stack"><strong>${lang === 'es' ? 'Referencia' : 'Reference'}:</strong> <a href="${escapeHtml(entry.href)}">${escapeHtml(entry.href)}</a></p>`
        : '';

      return `<article class="role">${header}${bullets}${link}</article>`;
    })
    .join('');
}

function renderCertifications(entries: CvCertificationEntry[], lang: Lang): string {
  return entries
    .map((entry) => {
      const issuerParts = [entry.issuer, entry.issuedAt].filter(Boolean).join(' | ');
      const credentialParts = [
        entry.credentialId ? `${lang === 'es' ? 'Credencial' : 'Credential'}: ${entry.credentialId}` : '',
        entry.href,
      ].filter(Boolean);

      return [
        '<article class="role">',
        `<h3>${escapeHtml(entry.name)}</h3>`,
        issuerParts ? `<p class="tech-stack">${escapeHtml(issuerParts)}</p>` : '',
        credentialParts.length > 0
          ? `<p class="tech-stack">${credentialParts
            .map((part) => entry.href && part === entry.href
              ? `<a href="${escapeHtml(part)}">${escapeHtml(part)}</a>`
              : escapeHtml(part))
            .join(' | ')}</p>`
          : '',
        '</article>',
      ].join('');
    })
    .join('');
}

export async function generateCvPdf(lang: Lang): Promise<CvPdfResult> {
  const database = getDatabase();

  const [profile, experience, education, certifications, techSkills, socialLinks] = await Promise.all([
    database.collection<ProfileDocument>(DatabaseCollectionEnum.PROFILE).findOne({ key: ProfileKeyEnum.MAIN_PROFILE }),
    database
      .collection<ContentDocument>(ContentCollectionEnum.EXPERIENCE)
      .find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray(),
    database
      .collection<ContentDocument>(ContentCollectionEnum.EDUCATION)
      .find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray(),
    database
      .collection<ContentDocument>(ContentCollectionEnum.CERTIFICATIONS)
      .find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray(),
    database
      .collection<ContentDocument>(ContentCollectionEnum.TECH_SKILLS)
      .find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray(),
    database
      .collection<ContentDocument>(ContentCollectionEnum.SOCIAL_LINKS)
      .find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .toArray(),
  ]);

  const fullName = normalizeText(getText(profile?.label, lang) || getText(profile?.title, lang) || 'Portfolio Owner');
  const about = normalizeText(profile?.metadata?.about && typeof profile.metadata.about === 'object'
    ? getText(profile.metadata.about as { es?: string; en?: string }, lang)
    : getText(profile?.description, lang));
  const email = normalizeText(profile?.email || '');
  const phone = normalizeText(profile?.phone || '');
  const location = normalizeText(profile?.location || '');
  const headline = normalizeText(getText(profile?.title, lang));

  const socialEntries = socialLinks
    .map((entry) => ({
      label: normalizeText(getText(entry.label, lang) || getText(entry.title, lang)),
      href: normalizeText(entry.href || (typeof entry.value === 'string' ? entry.value : '')),
    }))
    .filter((entry) => entry.label || entry.href);

  const skillMap = new Map(
    techSkills.map((skill) => [
      String(skill._id),
      normalizeText(getText(skill.label, lang) || getText(skill.title, lang)),
    ]),
  );

  const allSkillNames = techSkills
    .map((skill) => normalizeText(getText(skill.label, lang) || getText(skill.title, lang)))
    .filter(Boolean);

  const groupedSkills = new Map<string, string[]>();
  for (const skill of techSkills) {
    const skillName = normalizeText(getText(skill.label, lang) || getText(skill.title, lang));
    if (!skillName) continue;
    const groupName =
      metaStr(skill.metadata, 'category') ||
      metaStr(skill.metadata, 'group') ||
      metaStr(skill.metadata, 'section') ||
      metaStr(skill.metadata, 'type') ||
      '';

    const bucket = groupedSkills.get(groupName) || [];
    bucket.push(skillName);
    groupedSkills.set(groupName, bucket);
  }

  const experienceEntries = experience.map((entry): CvExperienceEntry => {
    const company = normalizeText(getText(entry.label, lang) || getText(entry.title, lang));
    const title = normalizeText(metaStr(entry.metadata, 'position') || getText(entry.title, lang));
    const experienceSkillIds = metaStringArray(entry.metadata, 'skillIds');
    const skills = [...new Set(
      experienceSkillIds
        .map((skillId) => skillMap.get(skillId) || '')
        .filter(Boolean),
    )];

    return {
      company,
      title,
      period: formatPeriod(entry.period, lang),
      descriptionLines: splitMultilineText(getText(entry.description, lang)),
      skills,
    };
  });

  const educationEntries = education.map((entry): CvEducationEntry => ({
    institution: normalizeText(getText(entry.label, lang) || getText(entry.title, lang)),
    degree: normalizeText(metaStr(entry.metadata, 'degree') || getText(entry.title, lang)),
    period: formatPeriod(entry.period, lang),
    descriptionLines: splitMultilineText(getText(entry.description, lang)),
    href: normalizeText(entry.href || ''),
  }));

  const certificationEntries = certifications.map((entry): CvCertificationEntry => {
    const issuer =
      metaStr(entry.metadata, 'issuer') ||
      metaStr(entry.metadata, 'platform') ||
      normalizeText(getText(entry.label, lang));

    return {
      name: normalizeText(getText(entry.title, lang) || getText(entry.label, lang)),
      issuer,
      issuedAt: metaStr(entry.metadata, 'issuedAt') || metaStr(entry.metadata, 'date') || formatPeriod(entry.period, lang),
      credentialId: metaStr(entry.metadata, 'credentialId') || metaStr(entry.metadata, 'credential'),
      href: normalizeText(entry.href || (typeof entry.value === 'string' ? entry.value : '')),
    };
  });

  const template = await readFile(TEMPLATE_PATH, 'utf-8');
  const contactItems = [
    renderContactItem(location),
    renderContactItem(phone),
    renderContactItem(email, email ? `mailto:${email}` : undefined),
    ...socialEntries.map((entry) => renderContactItem(entry.href || entry.label, entry.href || undefined)),
  ].join('');
  const html = replaceTemplateTokens(template, {
    lang,
    documentTitle: escapeHtml(lang === 'es' ? `CV - ${fullName}` : `Resume - ${fullName}`),
    fullName: escapeHtml(fullName),
    headline: escapeHtml(headline),
    contactItems,
    summarySection: about
      ? renderSection(lang === 'es' ? 'Perfil profesional' : 'Professional Summary', `<p class="summary">${escapeHtml(about)}</p>`)
      : '',
    skillsSection: allSkillNames.length > 0
      ? renderSection(lang === 'es' ? 'Habilidades técnicas' : 'Technical Skills', renderSkillGroups(groupedSkills, allSkillNames, lang))
      : '',
    experienceSection: renderSection(lang === 'es' ? 'Experiencia profesional' : 'Professional Experience', renderExperience(experienceEntries, lang)),
    educationSection: renderSection(lang === 'es' ? 'Educación' : 'Education', renderEducation(educationEntries, lang)),
    certificationsSection: renderSection(lang === 'es' ? 'Certificaciones' : 'Certifications', renderCertifications(certificationEntries, lang)),
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      displayHeaderFooter: false,
    });

    return {
      buffer: Buffer.from(pdf),
      fileName: makeDownloadFileName(fullName, lang),
    };
  } finally {
    await browser.close();
  }
}
