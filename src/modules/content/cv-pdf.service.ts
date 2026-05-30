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

function formatPeriod(period: ExperiencePeriod | undefined | null): string {
  if (!period?.start) return '';
  if (period.current || !period.end) return `${period.start} - Actual`;
  return `${period.start} - ${period.end}`;
}

function metaStr(metadata: Record<string, unknown> | undefined | null, key: string): string {
  const v = metadata?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

const COLORS = {
  primary: '#2563eb',
  dark: '#1e293b',
  muted: '#64748b',
  light: '#f1f5f9',
  border: '#e2e8f0',
  accent: '#0ea5e9',
};

const FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
};

export async function generateCvPdf(lang: Lang): Promise<Buffer> {
  const database = getDatabase();

  const [profile, experience, techSkills, socialLinks] = await Promise.all([
    database.collection<ProfileDocument>(DatabaseCollectionEnum.PROFILE).findOne({ key: ProfileKeyEnum.MAIN_PROFILE }),
    database
      .collection<ContentDocument>(ContentCollectionEnum.EXPERIENCE)
      .find({})
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
      .sort({ order: 1 })
      .toArray(),
  ]);

  const name = getText(profile?.title, lang) || (lang === 'es' ? 'Desarrollador' : 'Developer');
  const role = getText(profile?.description, lang) || '';
  const email = profile?.email || '';
  const phone = profile?.phone || '';
  const location = profile?.location || '';
  const about = getText(profile?.label, lang) || '';

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 52, right: 52 },
      info: {
        Title: lang === 'es' ? `CV - ${name}` : `Resume - ${name}`,
        Author: name,
      },
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ─── Header ───────────────────────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 130)
      .fill(COLORS.dark);

    doc
      .fillColor('#ffffff')
      .font(FONT.bold)
      .fontSize(26)
      .text(name, doc.page.margins.left, 36, { width: pageWidth });

    if (role) {
      doc
        .fillColor(COLORS.accent)
        .font(FONT.regular)
        .fontSize(12)
        .text(role, doc.page.margins.left, 68, { width: pageWidth });
    }

    // Contact info row
    const contactY = 92;
    const contactParts: string[] = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(phone);
    if (location) contactParts.push(location);

    doc
      .fillColor('#94a3b8')
      .font(FONT.regular)
      .fontSize(9)
      .text(contactParts.join('  ·  '), doc.page.margins.left, contactY, { width: pageWidth });

    doc.moveDown(0);
    doc.y = 148;

    // ─── Helper: section title ─────────────────────────────────────────────────
    function sectionTitle(title: string) {
      doc
        .fillColor(COLORS.primary)
        .font(FONT.bold)
        .fontSize(11)
        .text(title.toUpperCase(), { continued: false });

      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageWidth, doc.y)
        .strokeColor(COLORS.primary)
        .lineWidth(1.5)
        .stroke();

      doc.moveDown(0.5);
    }

    // ─── About ────────────────────────────────────────────────────────────────
    if (about) {
      sectionTitle(lang === 'es' ? 'Sobre mí' : 'About me');
      doc
        .fillColor(COLORS.dark)
        .font(FONT.regular)
        .fontSize(10)
        .text(about, { align: 'justify' });

      doc.moveDown(1.2);
    }

    // ─── Experience ───────────────────────────────────────────────────────────
    if (experience.length > 0) {
      sectionTitle(lang === 'es' ? 'Experiencia' : 'Experience');

      for (const exp of experience) {
        const title = getText(exp.title, lang);
        const desc = getText(exp.description, lang);
        const period = formatPeriod(exp.period);
        const company = metaStr(exp.metadata, 'company') || metaStr(exp.metadata, 'name');

        doc.font(FONT.bold).fontSize(10).fillColor(COLORS.dark).text(title || '', { continued: Boolean(period) });

        if (period) {
          doc.font(FONT.regular).fontSize(9).fillColor(COLORS.muted).text(`  ${period}`, { align: 'right' });
        } else {
          doc.moveDown(0);
        }

        if (company) {
          doc.font(FONT.regular).fontSize(9).fillColor(COLORS.accent).text(company);
        }

        if (desc) {
          doc.font(FONT.regular).fontSize(9).fillColor(COLORS.muted).text(desc, { align: 'justify' });
        }

        doc.moveDown(0.7);
      }

      doc.moveDown(0.5);
    }

    // ─── Skills ───────────────────────────────────────────────────────────────
    if (techSkills.length > 0) {
      sectionTitle(lang === 'es' ? 'Habilidades técnicas' : 'Technical skills');

      const skillNames = techSkills
        .map((s) => getText(s.label, lang) || getText(s.title, lang))
        .filter(Boolean);

      // Render skills as a wrapped comma-separated list styled as pills
      doc
        .fillColor(COLORS.dark)
        .font(FONT.regular)
        .fontSize(10)
        .text(skillNames.join('  ·  '), { align: 'left' });

      doc.moveDown(1.2);
    }

    // ─── Social links ─────────────────────────────────────────────────────────
    if (socialLinks.length > 0) {
      sectionTitle(lang === 'es' ? 'Redes y contacto' : 'Social & contact');

      for (const link of socialLinks) {
        const label = getText(link.label, lang) || getText(link.title, lang);
        const href = typeof link.href === 'string' ? link.href : '';

        if (!label && !href) continue;

        doc.font(FONT.bold).fontSize(9).fillColor(COLORS.dark).text(label || '', { continued: Boolean(href) });

        if (href) {
          doc.font(FONT.regular).fontSize(9).fillColor(COLORS.primary).text(`  ${href}`);
        } else {
          doc.moveDown(0);
        }
      }
    }

    // ─── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - doc.page.margins.bottom - 18;
    const generatedLabel = lang === 'es'
      ? `Generado el ${new Date().toLocaleDateString('es-CO')} — Portfolio dinámico`
      : `Generated on ${new Date().toLocaleDateString('en-US')} — Dynamic portfolio`;

    doc
      .fillColor(COLORS.muted)
      .font(FONT.regular)
      .fontSize(8)
      .text(generatedLabel, doc.page.margins.left, footerY, { width: pageWidth, align: 'center' });

    doc.end();
  });
}
