import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { getDatabase } from '../../config/db.js';
import type { AdminUserDocument } from '../../core/interfaces/domain.js';
import { fileService } from '../files/index.js';
import type {
  CreateAdminUserPayload,
  LoginAdminUserPayload,
  UpdateAdminUserPayload,
} from '../../core/interfaces/requests.js';
import { AdminUsersRepository } from '../../repositories/admin-users.repository.js';
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

export async function seedInitialContent() {
  const db = getDatabase();
  const now = new Date();
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
    headerLogo,
    aboutPrimaryImage,
    aboutSecondaryImage,
    footerCenterImage,
    heroSlideFallbackImage,
    projectFallbackImage,
    projectPlaceholder,
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
  ]);

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
      images: [projectPlaceholder],
      coverImage: projectPlaceholder,
      projectLink: 'https://example.com/starter-platform',
      codeLink: 'https://github.com/example/starter-platform',
      featured: true,
      status: 'published',
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
      images: [projectPlaceholder],
      coverImage: projectPlaceholder,
      projectLink: 'https://example.com/commerce-api',
      codeLink: 'https://github.com/example/commerce-api',
      featured: true,
      status: 'published',
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
      images: [projectPlaceholder],
      coverImage: projectPlaceholder,
      projectLink: 'https://example.com/ops-dashboard',
      codeLink: 'https://github.com/example/ops-dashboard',
      featured: true,
      status: 'published',
      publishedAt: '2025-01-01',
    },
  ];

  const techSkills = [
    ['angular', 'Angular', angularIcon],
    ['bootstrap', 'Bootstrap', bootstrapIcon],
    ['node-express', 'Node.js - Express', nodeExpressIcon],
    ['docker', 'Docker', dockerIcon],
    ['nestjs', 'Nest.js', nestJsIcon],
    ['postman', 'Postman', postmanIcon],
    ['typescript', 'TypeScript', typescriptIcon],
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

  const experience = [
    ['alpha-studio', '2025 - Actual', 'Alpha Studio', 'Rol de ejemplo para experiencias laborales configurables.', 'Example role for configurable work experiences.'],
    ['north-hub', '2024 - 2025', 'North Hub', 'Segunda experiencia base con descripcion editable desde el panel.', 'Second base experience with editable description from the dashboard.'],
    ['independent', '2023 - Actual', 'Independent Projects', 'Trabajo independiente en productos digitales y soporte tecnico.', 'Independent work across digital products and technical support.'],
    ['solid-ops', '2018 - 2023', 'Solid Ops', 'Experiencia senior orientada a coordinacion tecnica y continuidad operativa.', 'Senior experience focused on technical coordination and operational continuity.'],
    ['legacy-systems', '2013 - 2018', 'Legacy Systems', 'Experiencia historica para poblar la trayectoria profesional inicial.', 'Historic experience to populate the initial professional timeline.'],
  ].map(([slug, year, company, descriptionEs, descriptionEn], index) => {
    const [start, endLabel] = year.split(/\s*-\s*/u);
    const isCurrent = endLabel === 'Actual';

    return ({
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
  })});

  const testimonials = [
    ['client-one', 'Client One', 'Product Lead', 'Acme Corp', 'Este espacio muestra un testimonio de ejemplo listo para ser reemplazado con contenido real.', 'This area displays a starter testimonial ready to be replaced with real content.'],
    ['client-two', 'Client Two', 'Engineering Manager', 'North Hub', 'La estructura soporta testimonios bilingues y estados activos controlados desde el panel.', 'The structure supports bilingual testimonials and active states managed from the dashboard.'],
    ['client-three', 'Client Three', 'Founder', 'Studio Zero', 'Utiliza este item como referencia para cargar citas de clientes o colegas.', 'Use this item as a reference for loading quotes from clients or colleagues.'],
  ].map(([slug, name, position, company, testimonialEs, testimonialEn], index) => ({
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

  const socialLinks = [
    ['github', 'GitHub', 'https://github.com/', 'fa-brands fa-github'],
    ['linkedin', 'LinkedIn', 'https://www.linkedin.com/', 'fa-brands fa-linkedin'],
    ['x', 'X', 'https://x.com/', 'fa-brands fa-x-twitter'],
  ].map(([slug, name, href, icon], index) => ({
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

  const resumes = [
    ['portfolio-owner-cv-es', 'Portfolio Owner - CV Español', 'portfolio-owner-cv-es.pdf', 'application/pdf'],
    ['portfolio-owner-cv-en', 'Portfolio Owner - CV English', 'portfolio-owner-cv-en.pdf', 'application/pdf'],
  ].map(([slug, title, fileName, mimeType], index) => ({
    slug,
    label: { es: title.includes('Español') ? title : 'Portfolio Owner - CV Español', en: title.includes('English') ? title : 'Portfolio Owner - CV English' },
    title: { es: title.includes('Español') ? title : 'Portfolio Owner - CV Español', en: title.includes('English') ? title : 'Portfolio Owner - CV English' },
    description: { es: 'Documento base para hoja de vida descargable', en: 'Starter document for downloadable resume' },
    value: fileName,
    icon: null,
    href: '',
    order: index + 1,
    active: true,
    metadata: { language: slug.includes('es') ? 'es' : 'en' },
    fileName,
    mimeType,
    base64: createResumePdfBase64(title),
  }));

  const profile = {
    key: 'main-profile',
    slug: 'main-profile',
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
          image: heroSlideFallbackImage,
        },
        {
          title: { es: 'Desarrollador backend', en: 'Backend developer' },
          description: {
            es: 'Slide de ejemplo para una especialidad secundaria o complementaria.',
            en: 'Starter slide for a secondary or complementary specialization.',
          },
          image: heroKeyboardBackground,
        },
        {
          title: { es: 'Desarrollador frontend', en: 'Frontend developer' },
          description: {
            es: 'Slide final para completar la portada principal del portfolio.',
            en: 'Final starter slide used to complete the portfolio hero section.',
          },
          image: heroWallpaperBackground,
        },
      ],
      portfolioMedia: {
        headerLogo,
        aboutPrimaryImage,
        aboutSecondaryImage,
        footerCenterImage,
        cvHeroBackground,
        cvSectionBackground,
        heroSlideFallbackImage,
        projectFallbackImage,
        decorativeCloudIcon: cloudIcon,
        decorativeWebDevelopmentIcon: webDevelopmentIcon,
        decorativeMultitaskIcon: multitaskIcon,
        decorativeApiIcon: apiIcon,
        decorativeServerIcon: serverIcon,
        decorativeRainDigits: rainDigits,
        decorativeWebBackground: webBackground,
        testimonialLogos: [],
      },
    },
  };

  try {
    await db.collection('files').deleteMany({});
  } catch (error) {
    console.warn('Unable to clear files collection during seed.', error);
  }

  await db.collection('projects').deleteMany({});
  await db.collection('projects').insertMany(projects.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  await db.collection('tech_skills').deleteMany({});
  await db.collection('tech_skills').insertMany(techSkills.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  await db.collection('experience').deleteMany({});
  await db.collection('experience').insertMany(experience.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  await db.collection('testimonials').deleteMany({});
  await db.collection('testimonials').insertMany(testimonials.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  await db.collection('social_links').deleteMany({});
  await db.collection('social_links').insertMany(socialLinks.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  await db.collection('resumes').deleteMany({});
  await db.collection('resumes').insertMany(resumes.map((item) => ({ ...item, createdAt: now, updatedAt: now })));

  await db.collection('profile').deleteMany({ key: 'main-profile' });
  await db.collection('profile').insertOne({ ...profile, createdAt: now, updatedAt: now });

  return {
    seeded: true,
    collections: ['projects', 'tech_skills', 'experience', 'testimonials', 'social_links', 'resumes', 'profile'],
  };
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
  const requestedRole = typeof payload.role === 'string' ? payload.role : 'admin';
  const role = requestedRole === 'super_admin' || requestedRole === 'editor' ? requestedRole : 'admin';

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

  const adminUser = await database.collection<AdminUserDocument>('admin_users').findOne({
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

  const currentUser = await database.collection<AdminUserDocument>('admin_users').findOne({
    _id: new ObjectId(id),
  });

  if (!currentUser) {
    throw createHttpError(404, 'Admin user not found.');
  }

  const nextDisplayName = typeof payload.displayName === 'string'
    ? payload.displayName.trim()
    : currentUser.displayName;
  const requestedRole = typeof payload.role === 'string' ? payload.role : currentUser.role;
  const nextRole = requestedRole === 'super_admin' || requestedRole === 'editor' || requestedRole === 'admin'
    ? requestedRole
    : currentUser.role;
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
