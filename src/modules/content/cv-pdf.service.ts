import PDFDocument from 'pdfkit';
import { getDatabase } from '../../config/db.js';
import { ContentCollectionEnum } from '../../core/enums/content-collection.enum.js';
import { DatabaseCollectionEnum } from '../../core/enums/database-collection.enum.js';
import { ProfileKeyEnum } from '../../core/enums/profile-key.enum.js';
import type { ContentDocument, ExperiencePeriod, ProfileDocument } from '../../core/interfaces/domain.js';

type Lang = 'es' | 'en';

function getText(obj: { es?: string; en?: string } | undefined, lang: Lang): string {
  if (!obj) return '';
  return (lang === 'es' ? obj.es : obj.en) || obj.es || obj.en || '';
}

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
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

const COLORS = {
  ink: '#587392',
  body: '#5c5c5c',
  subtle: '#727272',
  border: '#d7dee5',
  faint: '#f7f9fb',
  link: '#707070',
};

const FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  oblique: 'Helvetica-Oblique',
};

export async function generateCvPdf(lang: Lang): Promise<Buffer> {
  const database = getDatabase();

  const [profile, experience, techSkills, socialLinks] = await Promise.all([
    database.collection<ProfileDocument>(DatabaseCollectionEnum.PROFILE).findOne({ key: ProfileKeyEnum.MAIN_PROFILE }),
    database
      .collection<ContentDocument>(ContentCollectionEnum.EXPERIENCE)
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

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 44, bottom: 44, left: 54, right: 54 },
      info: {
        Title: lang === 'es' ? `CV - ${fullName}` : `Resume - ${fullName}`,
        Author: fullName,
      },
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;

    const ensureSpace = (neededHeight: number) => {
      if (doc.y + neededHeight <= pageBottom - 28) {
        return;
      }

      doc.addPage();
      doc.y = doc.page.margins.top;
    };

    const divider = () => {
      doc
        .moveTo(doc.page.margins.left + 34, doc.y)
        .lineTo(doc.page.margins.left + pageWidth - 34, doc.y)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.65);
    };

    const sectionTitle = (title: string) => {
      ensureSpace(36);
      doc.moveDown(0.3);
      doc
        .fillColor(COLORS.ink)
        .font(FONT.bold)
        .fontSize(11)
        .text(title.toUpperCase(), doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: 'center',
          characterSpacing: 2.3,
        });
      doc.moveDown(0.38);
      divider();
    };

    const renderLinkRow = (values: string[]) => {
      const line = values.filter(Boolean).join('  |  ');
      if (!line) return;
      doc
        .fillColor(COLORS.link)
        .font(FONT.regular)
        .fontSize(9.8)
        .text(line, doc.page.margins.left, doc.y, { width: pageWidth, align: 'center' });
      doc.moveDown(0.14);
    };

    const renderBulletList = (items: string[], options?: { x?: number; width?: number; fontSize?: number; color?: string }) => {
      const x = options?.x ?? doc.page.margins.left + 14;
      const width = options?.width ?? pageWidth - 28;
      const fontSize = options?.fontSize ?? 10.2;
      const color = options?.color ?? COLORS.body;

      for (const item of items) {
        const text = normalizeText(item);
        if (!text) continue;
        ensureSpace(18);
        doc
          .fillColor(color)
          .font(FONT.regular)
          .fontSize(fontSize)
          .text(`- ${text}`, x, doc.y, {
            width,
            align: 'left',
            lineGap: 0.4,
          });
        doc.moveDown(0.04);
      }
    };

    const renderSkillStack = (title: string, skills: string[]) => {
      if (skills.length === 0) return;
      ensureSpace(18);
      doc
        .fillColor(COLORS.body)
        .font(FONT.bold)
        .fontSize(9.6)
        .text(title, doc.page.margins.left + 22, doc.y, { continued: true });
      doc
        .fillColor(COLORS.subtle)
        .font(FONT.regular)
        .fontSize(9.6)
        .text(skills.join(', '), {
          width: pageWidth - 40,
          align: 'left',
          lineGap: 0.4,
        });
      doc.moveDown(0.08);
    };

    const experienceDivider = () => {
      doc
        .moveTo(doc.page.margins.left + 4, doc.y)
        .lineTo(doc.page.margins.left + pageWidth - 4, doc.y)
        .strokeColor(COLORS.border)
        .lineWidth(0.8)
        .stroke();
      doc.moveDown(0.5);
    };

    const renderSkillGroups = () => {
      const categorizedEntries = [...groupedSkills.entries()].filter(([groupName]) => Boolean(groupName));
      const uncategorizedItems = groupedSkills.get('') || [];

      if (categorizedEntries.length === 0) {
        renderBulletList(allSkillNames, {
          x: doc.page.margins.left + 18,
          width: pageWidth - 36,
          fontSize: 10.8,
        });
        return;
      }

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

      for (const [groupName, skills] of categorizedEntries) {
        ensureSpace(28);
        const normalizedGroupKey = groupName.trim().toLowerCase();
        const translatedLabel = groupLabels[normalizedGroupKey];
        const displayLabel = translatedLabel ? translatedLabel[lang] : groupName;

        doc
          .fillColor(COLORS.subtle)
          .font(FONT.bold)
          .fontSize(10.1)
          .text(`- ${displayLabel}: `, doc.page.margins.left + 14, doc.y, { continued: true });
        doc
          .fillColor(COLORS.body)
          .font(FONT.regular)
          .fontSize(10.1)
          .text(skills.join(', '), {
            width: pageWidth - 28,
            lineGap: 0.4,
          });
        doc.moveDown(0.05);
      }

      if (uncategorizedItems.length > 0) {
        renderBulletList(uncategorizedItems, {
          x: doc.page.margins.left + 14,
          width: pageWidth - 28,
          fontSize: 10.1,
        });
      }
    };

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.y = 34;

    doc
      .fillColor(COLORS.ink)
      .font(FONT.bold)
      .fontSize(32)
      .text(fullName.toUpperCase(), doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'center',
        characterSpacing: 4.2,
      });

    doc.moveDown(1.05);

    if (headline) {
      doc
        .fillColor(COLORS.subtle)
        .font(FONT.regular)
        .fontSize(9.6)
        .text(headline, doc.page.margins.left, doc.y, { width: pageWidth, align: 'center' });
      doc.moveDown(0.18);
    }

    const primaryContact = [location, phone].filter(Boolean);
    if (primaryContact.length > 0) {
      doc
        .fillColor(COLORS.link)
        .font(FONT.regular)
        .fontSize(9.5)
        .text(primaryContact.join('  |  '), doc.page.margins.left, doc.y, { width: pageWidth, align: 'center' });
      doc.moveDown(0.08);
    }

    renderLinkRow(email ? [email] : []);
    renderLinkRow(socialEntries.slice(0, 2).map((entry) => entry.href || entry.label));
    renderLinkRow(socialEntries.slice(2).map((entry) => entry.href || entry.label));

    doc.moveDown(0.36);

    if (about) {
      sectionTitle(lang === 'es' ? 'Sobre mí' : 'About me');
      doc
        .fillColor(COLORS.body)
        .font(FONT.oblique)
        .fontSize(10.25)
        .text(about, doc.page.margins.left + 18, doc.y, {
          width: pageWidth - 36,
          align: 'justify',
          lineGap: 0.8,
        });
      doc.moveDown(0.62);
    }

    if (allSkillNames.length > 0) {
      sectionTitle(lang === 'es' ? 'Habilidades técnicas' : 'Tech skills');
      renderSkillGroups();
      doc.moveDown(0.45);
    }

    if (experience.length > 0) {
      sectionTitle(lang === 'es' ? 'Experiencia' : 'Experience');

      for (const [index, entry] of experience.entries()) {
        const company = normalizeText(getText(entry.label, lang) || getText(entry.title, lang));
        const period = formatPeriod(entry.period, lang);
        const description = getText(entry.description, lang);
        const title = normalizeText(metaStr(entry.metadata, 'position') || getText(entry.title, lang));
        const experienceSkillIds = metaStringArray(entry.metadata, 'skillIds');
        const experienceSkills = [...new Set(
          experienceSkillIds
            .map((skillId) => skillMap.get(skillId) || '')
            .filter(Boolean),
        )];
        const descriptionLines = splitMultilineText(description);
        const estimatedHeight =
          16 +
          (title && title !== company ? 12 : 0) +
          descriptionLines.length * 12 +
          (experienceSkills.length ? 12 : 0) +
          (index < experience.length - 1 ? 22 : 0);

        ensureSpace(estimatedHeight);

        doc
          .font(FONT.bold)
          .fontSize(10.3)
          .fillColor(COLORS.body)
          .text(company, doc.page.margins.left, doc.y, {
            width: pageWidth * 0.6,
            align: 'left',
            continued: Boolean(period),
          });

        if (period) {
          doc
            .font(FONT.bold)
            .fontSize(9.9)
            .fillColor(COLORS.body)
            .text(period, {
              width: pageWidth,
              align: 'right',
              underline: true,
            });
        } else {
          doc.moveDown(0.1);
        }

        if (title && title !== company) {
          doc
            .font(FONT.regular)
            .fontSize(9.8)
            .fillColor(COLORS.subtle)
            .text(title, doc.page.margins.left + 2, doc.y, { width: pageWidth });
          doc.moveDown(0.08);
        }

        if (descriptionLines.length > 0) {
          renderBulletList(descriptionLines, {
            x: doc.page.margins.left + 12,
            width: pageWidth - 24,
            fontSize: 9.9,
          });
        }

        renderSkillStack(lang === 'es' ? 'Stack usado: ' : 'Tech stack: ', experienceSkills);

        doc.moveDown(0.42);

        if (index < experience.length - 1) {
          experienceDivider();
        }
      }
    }

    doc.end();
  });
}
