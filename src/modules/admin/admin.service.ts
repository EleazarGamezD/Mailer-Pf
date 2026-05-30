import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { getDatabase } from '../../config/db.js';
import { AdminRoleEnum } from '../../core/enums/admin-role.enum.js';
import { ContentCollectionEnum } from '../../core/enums/content-collection.enum.js';
import { DatabaseCollectionEnum } from '../../core/enums/database-collection.enum.js';
import { ProfileKeyEnum } from '../../core/enums/profile-key.enum.js';
import { ProjectStatusEnum } from '../../core/enums/project-status.enum.js';
import type { AdminUserDocument } from '../../core/interfaces/domain.js';
import { fileService } from '../files/index.js';
import type {
  CreateAdminUserPayload,
  LoginAdminUserPayload,
  UpdateAdminUserPayload,
} from '../../core/interfaces/requests.js';
import { AdminUsersRepository } from '../../repositories/admin-users.repository.js';
import { parseEnumValue } from '../../utils/enum.js';
import { createHttpError } from '../../utils/http-error.js';
import { signAdminToken } from '../../utils/jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';

const adminUsersRepository = new AdminUsersRepository();

const backendSeedAssetRoot = new URL('../../../../Mailer-Pf/src/assets/seed-media/', import.meta.url);

const mimeTypeByExtension: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

async function uploadSeedAsset(relativePath: string) {
  const assetUrl = new URL(relativePath, backendSeedAssetRoot);
  const buffer = await readFile(assetUrl);
  const extension = extname(assetUrl.pathname).replace(/^\./u, '').toLowerCase();

  return fileService.uploadFile({
    buffer,
    base64: buffer.toString('base64'),
    extension,
    mimeType: mimeTypeByExtension[extension] || 'application/octet-stream',
    originalName: basename(assetUrl.pathname),
    name: basename(assetUrl.pathname),
    size: buffer.length,
  });
}

async function uploadSvgPlaceholder(label: string, width = 1200, height = 800) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#eef4fb"/>
          <stop offset="100%" stop-color="#d6e4f4"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="28" fill="none" stroke="#7b8aa0" stroke-width="4" stroke-dasharray="16 10"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#28476f" font-family="Arial, sans-serif" font-size="${Math.max(
        26,
        Math.floor(width / 16),
      )}" font-weight="700">${label}</text>
    </svg>
  `.trim();
  const buffer = Buffer.from(svg, 'utf-8');

  return fileService.uploadFile({
    buffer,
    base64: buffer.toString('base64'),
    extension: 'svg',
    mimeType: 'image/svg+xml',
    originalName: `${label.toLowerCase().replace(/\s+/gu, '-')}.svg`,
    name: `${label}.svg`,
    size: buffer.length,
  });
}

function createResumePdfBase64(title: string) {
  const safeTitle = title.replace(/[()]/gu, '');
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 86 >>
stream
BT
/F1 22 Tf
72 760 Td
(${safeTitle}) Tj
0 -34 Td
/F1 12 Tf
(Replace this placeholder resume from the admin panel.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000385 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
455
%%EOF`;

  return Buffer.from(pdf, 'utf-8').toString('base64');
}

type SeedPreset = 'starter' | 'demo-personal';

const collectionsToResetBeforeSeed = [
  DatabaseCollectionEnum.PROJECTS,
  DatabaseCollectionEnum.PROFILE,
  DatabaseCollectionEnum.ANALYTICS_EVENTS,
  ContentCollectionEnum.TECH_SKILLS,
  ContentCollectionEnum.EXPERIENCE,
  ContentCollectionEnum.TESTIMONIALS,
  ContentCollectionEnum.SOCIAL_LINKS,
  ContentCollectionEnum.RESUMES,
] as const;

interface SeedAssets {
  angularIcon: string;
  bootstrapIcon: string;
  nodeExpressIcon: string;
  dockerIcon: string;
  nestJsIcon: string;
  postmanIcon: string;
  typescriptIcon: string;
  apiIcon: string;
  cloudIcon: string;
  multitaskIcon: string;
  serverIcon: string;
  webDevelopmentIcon: string;
  rainDigits: string;
  webBackground: string;
  cvHeroBackground: string;
  cvSectionBackground: string;
  heroKeyboardBackground: string;
  heroWallpaperBackground: string;
  starterHeaderLogo: string;
  starterAboutPrimaryImage: string;
  starterAboutSecondaryImage: string;
  starterFooterCenterImage: string;
  heroSlideFallbackImage: string;
  projectFallbackImage: string;
  projectPlaceholder: string;
  personalHeaderLogo: string;
  personalAboutPrimaryImage: string;
  personalAboutSecondaryImage: string;
  personalFooterCenterImage: string;
}

interface SeedBundle {
  projects: Record<string, unknown>[];
  techSkills: Record<string, unknown>[];
  experience: Record<string, unknown>[];
  testimonials: Record<string, unknown>[];
  socialLinks: Record<string, unknown>[];
  resumes: Record<string, unknown>[];
  profile: Record<string, unknown>;
}

async function loadSeedAssets(): Promise<SeedAssets> {
  console.log('[seed] Uploading seed assets...');

  const [
    angularIcon,
    bootstrapIcon,
    nodeExpressIcon,
    dockerIcon,
    nestJsIcon,
    postmanIcon,
    typescriptIcon,
    apiIcon,
    cloudIcon,
    multitaskIcon,
    serverIcon,
    webDevelopmentIcon,
    rainDigits,
    webBackground,
    cvHeroBackground,
    cvSectionBackground,
    heroKeyboardBackground,
    heroWallpaperBackground,
    starterHeaderLogo,
    starterAboutPrimaryImage,
    starterAboutSecondaryImage,
    starterFooterCenterImage,
    heroSlideFallbackImage,
    projectFallbackImage,
    projectPlaceholder,
    personalHeaderLogo,
    personalAboutPrimaryImage,
    personalAboutSecondaryImage,
    personalFooterCenterImage,
  ] = await Promise.all([
    uploadSeedAsset('shared/svg/angular-svgrepo-com.svg'),
    uploadSeedAsset('shared/svg/bootstrap-svgrepo-com.svg'),
    uploadSeedAsset('shared/svg/node-js-svgrepo-com.svg'),
    uploadSeedAsset('shared/svg/docker-svgrepo-com.svg'),
    uploadSeedAsset('shared/svg/nestjs-svgrepo-com.svg'),
    uploadSeedAsset('shared/svg/postman-icon-svgrepo-com.svg'),
    uploadSeedAsset('shared/svg/typescript-logo-svgrepo-com.svg'),
    uploadSeedAsset('shared/images/api_icon.webp'),
    uploadSeedAsset('shared/images/cloud_icon.webp'),
    uploadSeedAsset('shared/images/multitask_icon.webp'),
    uploadSeedAsset('shared/images/server_icon.webp'),
    uploadSeedAsset('shared/images/web_develop_icon.webp'),
    uploadSeedAsset('shared/backgrounds/background-numbers-rain.jpg'),
    uploadSeedAsset('shared/backgrounds/web-background.webp'),
    uploadSeedAsset('shared/backgrounds/desktop-v3.webp'),
    uploadSeedAsset('shared/backgrounds/bg-1.webp'),
    uploadSeedAsset('shared/backgrounds/keyboard.webp'),
    uploadSeedAsset('shared/backgrounds/wallpaperflare.jpg'),
    uploadSvgPlaceholder('Portfolio Logo', 640, 240),
    uploadSvgPlaceholder('About Photo A', 900, 1100),
    uploadSvgPlaceholder('About Photo B', 900, 1100),
    uploadSvgPlaceholder('Footer Badge', 480, 480),
    uploadSeedAsset('shared/backgrounds/bg-1.webp'),
    uploadSeedAsset('shared/backgrounds/desktop-v3.webp'),
    uploadSvgPlaceholder('Project Placeholder', 1200, 900),
    uploadSeedAsset('archive/home/logo-yo-bh.webp'),
    uploadSeedAsset('archive/home/PortfolioFoto1.jpg'),
    uploadSeedAsset('archive/home/profile_v2.jpg'),
    uploadSeedAsset('archive/home/FOOTER_CENTER_IMG.png'),
  ]);

  console.log('[seed] Seed assets uploaded successfully.');

  return {
    angularIcon,
    bootstrapIcon,
    nodeExpressIcon,
    dockerIcon,
    nestJsIcon,
    postmanIcon,
    typescriptIcon,
    apiIcon,
    cloudIcon,
    multitaskIcon,
    serverIcon,
    webDevelopmentIcon,
    rainDigits,
    webBackground,
    cvHeroBackground,
    cvSectionBackground,
    heroKeyboardBackground,
    heroWallpaperBackground,
    starterHeaderLogo,
    starterAboutPrimaryImage,
    starterAboutSecondaryImage,
    starterFooterCenterImage,
    heroSlideFallbackImage,
    projectFallbackImage,
    projectPlaceholder,
    personalHeaderLogo,
    personalAboutPrimaryImage,
    personalAboutSecondaryImage,
    personalFooterCenterImage,
  };
}

function buildTechSkills(assets: SeedAssets) {
  return [
    ['angular', 'Angular', assets.angularIcon],
    ['bootstrap', 'Bootstrap', assets.bootstrapIcon],
    ['node-express', 'Node.js - Express', assets.nodeExpressIcon],
    ['docker', 'Docker', assets.dockerIcon],
    ['nestjs', 'Nest.js', assets.nestJsIcon],
    ['postman', 'Postman', assets.postmanIcon],
    ['typescript', 'TypeScript', assets.typescriptIcon],
  ].map(([slug, name, icon], index) => ({
    slug,
    label: { es: name, en: name },
    title: { es: name, en: name },
    description: { es: '', en: '' },
    value: name,
    icon,
    href: '',
    order: index + 1,
    active: true,
    metadata: {},
    fileName: '',
    mimeType: '',
    base64: '',
  }));
}

function buildExperience(
  items: Array<[string, string, string, string, string]>,
) {
  return items.map(([slug, year, company, descriptionEs, descriptionEn], index) => {
    const [start, endLabel] = year.split(/\s*-\s*/u);
    const isCurrent = endLabel === 'Actual';

    return {
      slug,
      label: { es: company, en: company },
      title: { es: company, en: company },
      description: { es: descriptionEs, en: descriptionEn },
      value: year,
      period: {
        start,
        end: isCurrent ? null : endLabel,
        current: isCurrent,
      },
      icon: null,
      href: '',
      order: index + 1,
      active: true,
      metadata: { year },
      fileName: '',
      mimeType: '',
      base64: '',
    };
  });
}

function buildTestimonials(
  items: Array<[string, string, string, string, string, string]>,
) {
  return items.map(([slug, name, position, company, testimonialEs, testimonialEn], index) => ({
    slug,
    label: { es: name, en: name },
    title: { es: `${name} - ${position}`, en: `${name} - ${position}` },
    description: { es: testimonialEs, en: testimonialEn },
    value: name,
    icon: null,
    href: '',
    order: index + 1,
    active: true,
    metadata: { position, company, name },
    fileName: '',
    mimeType: '',
    base64: '',
  }));
}

function buildSocialLinks(items: Array<[string, string, string, string]>) {
  return items.map(([slug, name, href, icon], index) => ({
    slug,
    label: { es: name, en: name },
    title: { es: name, en: name },
    description: { es: '', en: '' },
    value: href,
    icon,
    href,
    order: index + 1,
    active: true,
    metadata: {},
    fileName: '',
    mimeType: '',
    base64: '',
  }));
}

function buildResumes(items: Array<[string, string, string, string, string]>) {
  return items.map(([slug, labelEs, labelEn, fileName, language], index) => ({
    slug,
    label: { es: labelEs, en: labelEn },
    title: { es: labelEs, en: labelEn },
    description: {
      es: 'Documento base para hoja de vida descargable',
      en: 'Starter document for downloadable resume',
    },
    value: fileName,
    icon: null,
    href: '',
    order: index + 1,
    active: true,
    metadata: { language },
    fileName,
    mimeType: 'application/pdf',
    base64: createResumePdfBase64(language === 'es' ? labelEs : labelEn),
  }));
}

function buildStarterSeedBundle(assets: SeedAssets): SeedBundle {
  const projects = [
    {
      slug: 'starter-platform',
      title: { es: 'Starter Platform', en: 'Starter Platform' },
      summary: {
        es: 'Base de aplicacion fullstack lista para personalizar.',
        en: 'Fullstack starter application ready to customize.',
      },
      description: {
        es: 'Proyecto semilla con estructura de frontend y backend pensada para servir como punto de partida de un portfolio profesional configurable.',
        en: 'Seed project with frontend and backend structure designed as a configurable professional portfolio starting point.',
      },
      stack: ['Angular', 'Node.js', 'Express', 'MongoDB'],
      images: [assets.projectPlaceholder],
      coverImage: assets.projectPlaceholder,
      projectLink: 'https://example.com/starter-platform',
      codeLink: 'https://github.com/example/starter-platform',
      featured: true,
      status: ProjectStatusEnum.PUBLISHED,
      publishedAt: '2025-01-01',
    },
    {
      slug: 'commerce-api',
      title: { es: 'Commerce API', en: 'Commerce API' },
      summary: {
        es: 'Servicio de e-commerce modular con enfoque en escalabilidad.',
        en: 'Modular e-commerce service focused on scalability.',
      },
      description: {
        es: 'Ejemplo de arquitectura para catalogo, carrito y autenticacion, pensado como referencia para soluciones de negocio modernas.',
        en: 'Architecture example for catalog, cart, and authentication, intended as a reference for modern business solutions.',
      },
      stack: ['NestJS', 'TypeScript', 'PostgreSQL', 'JWT'],
      images: [assets.projectPlaceholder],
      coverImage: assets.projectPlaceholder,
      projectLink: 'https://example.com/commerce-api',
      codeLink: 'https://github.com/example/commerce-api',
      featured: true,
      status: ProjectStatusEnum.PUBLISHED,
      publishedAt: '2025-01-01',
    },
    {
      slug: 'ops-dashboard',
      title: { es: 'Ops Dashboard', en: 'Ops Dashboard' },
      summary: {
        es: 'Panel de operaciones con reporting y control de contenido.',
        en: 'Operations dashboard with reporting and content control.',
      },
      description: {
        es: 'Muestra una experiencia administrativa orientada a configuracion visual, orden de contenido y flujos de mantenimiento sobre datos dinamicos.',
        en: 'Showcases an administrative experience focused on visual configuration, content ordering, and maintenance flows over dynamic data.',
      },
      stack: ['Angular', 'Express', 'MongoDB', 'CoreUI'],
      images: [assets.projectPlaceholder],
      coverImage: assets.projectPlaceholder,
      projectLink: 'https://example.com/ops-dashboard',
      codeLink: 'https://github.com/example/ops-dashboard',
      featured: true,
      status: ProjectStatusEnum.PUBLISHED,
      publishedAt: '2025-01-01',
    },
  ];

  return {
    projects,
    techSkills: buildTechSkills(assets),
    experience: buildExperience([
      ['alpha-studio', '2025 - Actual', 'Alpha Studio', 'Rol de ejemplo para experiencias laborales configurables.', 'Example role for configurable work experiences.'],
      ['north-hub', '2024 - 2025', 'North Hub', 'Segunda experiencia base con descripcion editable desde el panel.', 'Second base experience with editable description from the dashboard.'],
      ['independent', '2023 - Actual', 'Independent Projects', 'Trabajo independiente en productos digitales y soporte tecnico.', 'Independent work across digital products and technical support.'],
      ['solid-ops', '2018 - 2023', 'Solid Ops', 'Experiencia senior orientada a coordinacion tecnica y continuidad operativa.', 'Senior experience focused on technical coordination and operational continuity.'],
      ['legacy-systems', '2013 - 2018', 'Legacy Systems', 'Experiencia historica para poblar la trayectoria profesional inicial.', 'Historic experience to populate the initial professional timeline.'],
    ]),
    testimonials: buildTestimonials([
      ['client-one', 'Client One', 'Product Lead', 'Acme Corp', 'Este espacio muestra un testimonio de ejemplo listo para ser reemplazado con contenido real.', 'This area displays a starter testimonial ready to be replaced with real content.'],
      ['client-two', 'Client Two', 'Engineering Manager', 'North Hub', 'La estructura soporta testimonios bilingues y estados activos controlados desde el panel.', 'The structure supports bilingual testimonials and active states managed from the dashboard.'],
      ['client-three', 'Client Three', 'Founder', 'Studio Zero', 'Utiliza este item como referencia para cargar citas de clientes o colegas.', 'Use this item as a reference for loading quotes from clients or colleagues.'],
    ]),
    socialLinks: buildSocialLinks([
      ['github', 'GitHub', 'https://github.com/', 'fa-brands fa-github'],
      ['linkedin', 'LinkedIn', 'https://www.linkedin.com/', 'fa-brands fa-linkedin'],
      ['x', 'X', 'https://x.com/', 'fa-brands fa-x-twitter'],
    ]),
    resumes: buildResumes([
      ['portfolio-owner-cv-es', 'Portfolio Owner - CV Español', 'Portfolio Owner - CV English', 'portfolio-owner-cv-es.pdf', 'es'],
      ['portfolio-owner-cv-en', 'Portfolio Owner - CV Español', 'Portfolio Owner - CV English', 'portfolio-owner-cv-en.pdf', 'en'],
    ]),
    profile: {
      key: ProfileKeyEnum.MAIN_PROFILE,
      slug: ProfileKeyEnum.MAIN_PROFILE,
      label: { es: 'Portfolio Owner', en: 'Portfolio Owner' },
      title: {
        es: 'Entre interfaz y logica: un portfolio listo para personalizar.',
        en: 'Between interface and logic: a portfolio ready to customize.',
      },
      description: {
        es: 'Este perfil semilla demuestra como administrar contenido publico desde el backend, incluyendo textos, imagenes y recursos descargables.',
        en: 'This starter profile demonstrates how to manage public content from the backend, including text, imagery, and downloadable resources.',
      },
      availability: 'Disponible para nuevos proyectos',
      location: 'Ubicacion configurable desde el panel',
      email: '',
      phone: '',
      metadata: {
        about: {
          es: 'Reemplaza este bloque con una historia profesional breve, clara y enfocada en el valor que quieres comunicar en tu portfolio.',
          en: 'Replace this block with a short professional story focused on the value you want to communicate in your portfolio.',
        },
        heroSlides: [
          {
            title: { es: 'Desarrollador web', en: 'Web developer' },
            description: {
              es: 'Slide inicial de ejemplo para presentar un enfoque profesional principal.',
              en: 'Starter slide used to present a primary professional angle.',
            },
            image: assets.heroSlideFallbackImage,
          },
          {
            title: { es: 'Desarrollador backend', en: 'Backend developer' },
            description: {
              es: 'Slide de ejemplo para una especialidad secundaria o complementaria.',
              en: 'Starter slide for a secondary or complementary specialization.',
            },
            image: assets.heroKeyboardBackground,
          },
          {
            title: { es: 'Desarrollador frontend', en: 'Frontend developer' },
            description: {
              es: 'Slide final para completar la portada principal del portfolio.',
              en: 'Final starter slide used to complete the portfolio hero section.',
            },
            image: assets.heroWallpaperBackground,
          },
        ],
        portfolioMedia: {
          headerLogo: assets.starterHeaderLogo,
          aboutPrimaryImage: assets.starterAboutPrimaryImage,
          aboutSecondaryImage: assets.starterAboutSecondaryImage,
          footerCenterImage: assets.starterFooterCenterImage,
          cvHeroBackground: assets.cvHeroBackground,
          cvSectionBackground: assets.cvSectionBackground,
          heroSlideFallbackImage: assets.heroSlideFallbackImage,
          projectFallbackImage: assets.projectFallbackImage,
          decorativeCloudIcon: assets.cloudIcon,
          decorativeWebDevelopmentIcon: assets.webDevelopmentIcon,
          decorativeMultitaskIcon: assets.multitaskIcon,
          decorativeApiIcon: assets.apiIcon,
          decorativeServerIcon: assets.serverIcon,
          decorativeRainDigits: assets.rainDigits,
          decorativeWebBackground: assets.webBackground,
          testimonialLogos: [],
        },
      },
    },
  };
}

function buildDemoPersonalSeedBundle(assets: SeedAssets): SeedBundle {
  const projects = [
    {
      slug: 'portfolio-cms-dinamico',
      title: { es: 'Portfolio CMS Dinamico', en: 'Dynamic Portfolio CMS' },
      summary: {
        es: 'Portfolio administrable con contenido, media y seed desde backend.',
        en: 'Admin-driven portfolio with backend-managed content, media, and seed flows.',
      },
      description: {
        es: 'Proyecto personal enfocado en convertir un portfolio tradicional en una plataforma dinamica con panel administrativo, configuracion visual y recursos servidos desde backend.',
        en: 'Personal project focused on turning a traditional portfolio into a dynamic platform with an admin panel, visual configuration, and backend-served assets.',
      },
      stack: ['Angular', 'Express', 'MongoDB', 'CoreUI', 'MinIO'],
      images: [assets.projectPlaceholder],
      coverImage: assets.projectPlaceholder,
      projectLink: '',
      codeLink: 'https://github.com/EleazarGamezD',
      featured: true,
      status: ProjectStatusEnum.PUBLISHED,
      publishedAt: '2026-01-01',
    },
    {
      slug: 'meraki-office-marketplace',
      title: { es: 'Meraki Office Marketplace', en: 'Meraki Office Marketplace' },
      summary: {
        es: 'Marketplace con pasarelas de pago, chats y logistica.',
        en: 'Marketplace with payment gateways, chats, and logistics integrations.',
      },
      description: {
        es: 'Caso representativo de desarrollo fullstack aplicado a un marketplace con integraciones de pagos, comunicacion y operacion logistica.',
        en: 'Representative fullstack work applied to a marketplace with payment, communication, and logistics integrations.',
      },
      stack: ['Angular', 'Node.js', 'Express', 'MongoDB', 'Payments'],
      images: [assets.projectPlaceholder],
      coverImage: assets.projectPlaceholder,
      projectLink: '',
      codeLink: '',
      featured: true,
      status: ProjectStatusEnum.PUBLISHED,
      publishedAt: '2025-01-01',
    },
    {
      slug: 'custom-business-platforms',
      title: { es: 'Plataformas de Negocio a Medida', en: 'Custom Business Platforms' },
      summary: {
        es: 'Soluciones fullstack para operaciones, soporte y crecimiento digital.',
        en: 'Fullstack solutions for operations, support, and digital growth.',
      },
      description: {
        es: 'Compilacion de proyectos personalizados para empresas y clientes donde se priorizaron arquitectura limpia, mantenibilidad y velocidad de entrega.',
        en: 'Compilation of tailored projects for companies and clients prioritizing clean architecture, maintainability, and delivery speed.',
      },
      stack: ['TypeScript', 'Angular', 'Express', 'Docker'],
      images: [assets.projectPlaceholder],
      coverImage: assets.projectPlaceholder,
      projectLink: '',
      codeLink: '',
      featured: true,
      status: ProjectStatusEnum.PUBLISHED,
      publishedAt: '2024-01-01',
    },
  ];

  return {
    projects,
    techSkills: buildTechSkills(assets),
    experience: buildExperience([
      ['l4-ventures-llc', '2025 - Actual', 'L4 Ventures LLC', 'Desarrollador Fullstack, desarrollo de aplicaciones web.', 'Fullstack Developer focused on web application development.'],
      ['meraki-office', '2024 - 2025', 'Meraki Office', 'Desarrollador Fullstack, creacion de marketplace, integracion de pasarelas de pago, chats y plataformas de logistica.', 'Fullstack Developer, marketplace creation, payment gateway integration, chat systems, and logistics platforms.'],
      ['freelance', '2023 - Actual', 'Freelance', 'Desarrollador Fullstack en proyectos personalizados.', 'Fullstack Developer working on custom projects.'],
      ['postouch-colombia', '2018 - 2023', 'PosTouch Colombia S.A.S', 'Jefe de departamento tecnico, soporte a sistemas fiscales y contables.', 'Head of technical department, supporting fiscal and accounting systems.'],
      ['retail-pos-systems', '2013 - 2018', 'Retail Pos Systems Tec. C.A.', 'Jefe de departamento tecnico, soporte a sistemas fiscales y contables.', 'Head of technical department, supporting fiscal and accounting systems.'],
    ]),
    testimonials: buildTestimonials([
      ['arian-valdivieso', 'Arian Valdivieso', 'COO', 'Meraki Office', 'Eleazar demostro ser un miembro excepcional del equipo, destacandose por su naturaleza proactiva y sus notables habilidades de adaptacion. Su compromiso con los proyectos y entusiasmo por aprender contribuyo significativamente a nuestro exito en Meraki.', 'Eleazar proved to be an exceptional team member, standing out for his proactive nature and remarkable adaptability. His commitment to projects and eagerness to learn contributed significantly to our success at Meraki.'],
      ['wilhelm-flores', 'Wilhelm Flores', 'Full Stack Developer', 'Meraki Office', 'Eleazar es un excelente solucionador de problemas. Su capacidad para pensar fuera de lo convencional y proponer soluciones escalables fue clave para el exito de nuestros proyectos.', 'Eleazar is an excellent problem solver. His ability to think beyond the conventional and propose scalable solutions was key to the success of our projects.'],
      ['elvis-garcia', 'Elvis Garcia', 'Backend Developer / DevOps', 'Meraki Office', 'Trabaje con Eleazar resolviendo problemas tecnicos de forma eficiente y profesional. Durante nuestro tiempo juntos, demostro ser sumamente efectivo generando soluciones escalables y robustas para el equipo.', 'I worked with Eleazar solving technical issues efficiently and professionally. During our time together, he proved highly effective at delivering scalable and robust solutions for the team.'],
    ]),
    socialLinks: buildSocialLinks([
      ['github', 'GitHub', 'https://github.com/EleazarGamezD', 'fa-brands fa-github'],
      ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/eleazargamez/', 'fa-brands fa-linkedin'],
      ['x', 'X', 'https://x.com/Eleazar_Gamez', 'fa-brands fa-x-twitter'],
    ]),
    resumes: buildResumes([
      ['eleazar-gamez-cv-es', 'Eleazar Gamez - CV Español', 'Eleazar Gamez - CV English', 'eleazar-gamez-cv-es.pdf', 'es'],
      ['eleazar-gamez-cv-en', 'Eleazar Gamez - CV Español', 'Eleazar Gamez - CV English', 'eleazar-gamez-cv-en.pdf', 'en'],
    ]),
    profile: {
      key: ProfileKeyEnum.MAIN_PROFILE,
      slug: ProfileKeyEnum.MAIN_PROFILE,
      label: { es: 'Eleazar Gamez', en: 'Eleazar Gamez' },
      title: {
        es: 'Eleazar Gamez Fullstack Developer',
        en: 'Eleazar Gamez Fullstack Developer',
      },
      description: {
        es: 'Portfolio profesional de Eleazar Gamez, Fullstack Developer especializado en Angular, Node.js y mas tecnologias web.',
        en: 'Professional portfolio of Eleazar Gamez, Fullstack Developer focused on Angular, Node.js, and modern web technologies.',
      },
      availability: 'Disponible para nuevos proyectos',
      location: 'Colombia',
      email: 'eleazar.gamezd@gmail.com',
      phone: '',
      metadata: {
        about: {
          es: 'Desarrollador Fullstack con experiencia construyendo aplicaciones web, marketplaces y paneles administrativos. Mi enfoque combina producto, arquitectura y ejecucion tecnica para transformar ideas en soluciones funcionales y mantenibles.',
          en: 'Fullstack Developer with experience building web applications, marketplaces, and admin dashboards. My approach combines product thinking, architecture, and technical execution to turn ideas into functional, maintainable solutions.',
        },
        heroSlides: [
          {
            title: { es: 'Desarrollador web', en: 'Web developer' },
            description: {
              es: 'Construyo experiencias web completas desde interfaz hasta backend.',
              en: 'I build complete web experiences from interface to backend.',
            },
            image: assets.heroSlideFallbackImage,
          },
          {
            title: { es: 'Desarrollador backend', en: 'Backend developer' },
            description: {
              es: 'Diseño APIs, flujos de negocio y servicios listos para escalar.',
              en: 'I design APIs, business flows, and services ready to scale.',
            },
            image: assets.heroKeyboardBackground,
          },
          {
            title: { es: 'Desarrollador frontend', en: 'Frontend developer' },
            description: {
              es: 'Transformo interfaces en experiencias claras, modernas y configurables.',
              en: 'I turn interfaces into clear, modern, and configurable experiences.',
            },
            image: assets.heroWallpaperBackground,
          },
        ],
        portfolioMedia: {
          headerLogo: assets.personalHeaderLogo,
          aboutPrimaryImage: assets.personalAboutPrimaryImage,
          aboutSecondaryImage: assets.personalAboutSecondaryImage,
          footerCenterImage: assets.personalFooterCenterImage,
          cvHeroBackground: assets.cvHeroBackground,
          cvSectionBackground: assets.cvSectionBackground,
          heroSlideFallbackImage: assets.heroSlideFallbackImage,
          projectFallbackImage: assets.projectFallbackImage,
          decorativeCloudIcon: assets.cloudIcon,
          decorativeWebDevelopmentIcon: assets.webDevelopmentIcon,
          decorativeMultitaskIcon: assets.multitaskIcon,
          decorativeApiIcon: assets.apiIcon,
          decorativeServerIcon: assets.serverIcon,
          decorativeRainDigits: assets.rainDigits,
          decorativeWebBackground: assets.webBackground,
          testimonialLogos: [],
        },
      },
    },
  };
}

async function runSeedPreset(preset: SeedPreset) {
  const db = getDatabase();
  const now = new Date();

  console.log(`[seed] Starting preset: ${preset}`);

  for (const collectionName of collectionsToResetBeforeSeed) {
    try {
      console.log(`[seed] Clearing collection: ${collectionName}`);
      await db.collection(collectionName).deleteMany({});
    } catch (error) {
      console.warn(`Unable to clear ${collectionName} collection during seed.`, error);
    }
  }

  const assets = await loadSeedAssets();
  const bundle = preset === 'demo-personal'
    ? buildDemoPersonalSeedBundle(assets)
    : buildStarterSeedBundle(assets);

  console.log(`[seed] Inserting ${bundle.projects.length} projects...`);
  await db.collection(DatabaseCollectionEnum.PROJECTS).insertMany(bundle.projects.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  console.log(`[seed] Inserting ${bundle.techSkills.length} tech skills...`);
  await db.collection(ContentCollectionEnum.TECH_SKILLS).insertMany(bundle.techSkills.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  console.log(`[seed] Inserting ${bundle.experience.length} experience items...`);
  await db.collection(ContentCollectionEnum.EXPERIENCE).insertMany(bundle.experience.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  console.log(`[seed] Inserting ${bundle.testimonials.length} testimonials...`);
  await db.collection(ContentCollectionEnum.TESTIMONIALS).insertMany(bundle.testimonials.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  console.log(`[seed] Inserting ${bundle.socialLinks.length} social links...`);
  await db.collection(ContentCollectionEnum.SOCIAL_LINKS).insertMany(bundle.socialLinks.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  console.log(`[seed] Inserting ${bundle.resumes.length} resumes...`);
  await db.collection(ContentCollectionEnum.RESUMES).insertMany(bundle.resumes.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  console.log('[seed] Inserting profile...');
  await db.collection(DatabaseCollectionEnum.PROFILE).insertOne({ ...bundle.profile, createdAt: now, updatedAt: now });

  console.log(`[seed] Preset completed successfully: ${preset}`);

  return {
    seeded: true,
    preset,
    collections: [
      DatabaseCollectionEnum.PROJECTS,
      ContentCollectionEnum.TECH_SKILLS,
      ContentCollectionEnum.EXPERIENCE,
      ContentCollectionEnum.TESTIMONIALS,
      ContentCollectionEnum.SOCIAL_LINKS,
      ContentCollectionEnum.RESUMES,
      DatabaseCollectionEnum.PROFILE,
    ],
  };
}

export async function seedStarterContent() {
  return runSeedPreset('starter');
}

export async function seedDemoPersonalContent() {
  return runSeedPreset('demo-personal');
}

export async function seedInitialContent() {
  return seedStarterContent();
}

export async function seedDefaultThemes() {
  const db = getDatabase();
  const themesCollection = db.collection(DatabaseCollectionEnum.THEMES);

  const existing = await themesCollection.countDocuments();
  if (existing > 0) {
    console.log('[seed] Themes already seeded, skipping.');
    return { seeded: false, reason: 'already_seeded' };
  }

  const now = new Date();
  const themes = [
    { name: 'Azul Eléctrico', active: true, colors: { baseColor: '#2946f3' } },
    { name: 'Carmesí', active: false, colors: { baseColor: '#e83a3a' } },
    { name: 'Verde Esmeralda', active: false, colors: { baseColor: '#1a9e5c' } },
    { name: 'Violeta Real', active: false, colors: { baseColor: '#7c3aed' } },
    { name: 'Naranja Solar', active: false, colors: { baseColor: '#ef7c1a' } },
  ].map((t) => ({ ...t, createdAt: now, updatedAt: now }));

  await themesCollection.insertMany(themes);
  console.log('[seed] Inserted 5 default themes.');

  return { seeded: true, count: themes.length };
}

function sanitizeAdminUser(adminUser: AdminUserDocument | null) {
  if (!adminUser) {
    return null;
  }

  const { passwordHash: _passwordHash, ...safeAdminUser } = adminUser;
  return safeAdminUser;
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const username = typeof payload.username === 'string' ? payload.username.trim().toLowerCase() : '';
  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const role = parseEnumValue(AdminRoleEnum, payload.role, AdminRoleEnum.ADMIN);

  if (!email || !username || !displayName || !password) {
    throw createHttpError(400, 'email, username, displayName and password are required.');
  }

  if (password.length < 8) {
    throw createHttpError(400, 'password must contain at least 8 characters.');
  }

  const existingUser = await adminUsersRepository.findOne({
    $or: [{ email }, { username }],
  } as never);

  if (existingUser) {
    throw createHttpError(409, 'An admin user with that email or username already exists.');
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);

  const adminUser: AdminUserDocument = {
    email,
    username,
    displayName,
    passwordHash,
    role,
    active: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await adminUsersRepository.create(adminUser);
  const createdUser = await adminUsersRepository.findOne({ _id: insertedId } as never);

  return {
    created: true,
    user: sanitizeAdminUser(createdUser),
  };
}

export async function loginAdminUser(payload: LoginAdminUserPayload) {
  const login =
    typeof payload.email === 'string'
      ? payload.email.trim().toLowerCase()
      : typeof payload.login === 'string'
        ? payload.login.trim().toLowerCase()
        : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!login || !password) {
    throw createHttpError(400, 'email and password are required.');
  }

  const adminUser = await adminUsersRepository.findOne({
    $or: [{ email: login }, { username: login }],
  } as never);

  if (!adminUser || !adminUser.active) {
    throw createHttpError(401, 'Invalid admin credentials.');
  }

  const isValidPassword = await verifyPassword(password, adminUser.passwordHash);

  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid admin credentials.');
  }

  const now = new Date();
  await adminUsersRepository.updateById(adminUser._id!, {
    lastLoginAt: now,
    updatedAt: now,
  });

  const accessToken = signAdminToken({
    sub: String(adminUser._id),
    email: adminUser.email,
    username: adminUser.username,
    role: adminUser.role,
  });

  return {
    authenticated: true,
    accessToken,
    tokenType: 'Bearer',
    user: sanitizeAdminUser({
      ...adminUser,
      lastLoginAt: now,
      updatedAt: now,
    }),
  };
}

export async function getAdminUserById(id: string) {
  const database = getDatabase();
  const { ObjectId } = await import('mongodb');

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const adminUser = await database.collection<AdminUserDocument>(DatabaseCollectionEnum.ADMIN_USERS).findOne({
    _id: new ObjectId(id),
  });

  return sanitizeAdminUser(adminUser);
}

export async function listAdminUsers() {
  const adminUsers = await adminUsersRepository.find({}, {
    sort: { createdAt: -1 },
  });

  return adminUsers
    .map((adminUser) => sanitizeAdminUser(adminUser))
    .filter(Boolean);
}

export async function updateAdminUser(id: string, payload: UpdateAdminUserPayload) {
  const database = getDatabase();
  const { ObjectId } = await import('mongodb');

  if (!ObjectId.isValid(id)) {
    throw createHttpError(400, 'Invalid admin user id.');
  }

  const currentUser = await database.collection<AdminUserDocument>(DatabaseCollectionEnum.ADMIN_USERS).findOne({
    _id: new ObjectId(id),
  });

  if (!currentUser) {
    throw createHttpError(404, 'Admin user not found.');
  }

  const nextDisplayName = typeof payload.displayName === 'string'
    ? payload.displayName.trim()
    : currentUser.displayName;
  const nextRole = parseEnumValue(AdminRoleEnum, payload.role, currentUser.role);
  const nextActive = typeof payload.active === 'boolean' ? payload.active : currentUser.active;

  if (!nextDisplayName) {
    throw createHttpError(400, 'displayName is required.');
  }

  const updatedUser = await adminUsersRepository.updateById(currentUser._id!, {
    displayName: nextDisplayName,
    role: nextRole,
    active: nextActive,
    updatedAt: new Date(),
  });

  return {
    updated: true,
    user: sanitizeAdminUser(updatedUser),
  };
}
