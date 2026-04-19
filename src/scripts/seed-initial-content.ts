import { connectToDatabase, getDatabase } from '../config/db.js';
import { closeDatabaseConnection } from '../config/db.js';

async function seed() {
  await connectToDatabase();
  const db = getDatabase();
  const now = new Date();

  const projects = [
    {
      slug: 'mailer-app',
      title: { es: 'Mailer App', en: 'Mailer App' },
      summary: {
        es: 'API backend para envio de emails desde mi portafolio.',
        en: 'Backend API for sending emails from my portfolio.',
      },
      description: {
        es: 'API backend para envio de emails desde mi portafolio. Envia dos correos: uno para mi y otro para la persona que escribe, confirmando la recepcion.',
        en: 'Backend API for sending emails from my portfolio. It sends two emails: one to me and one to the person who writes, confirming receipt.',
      },
      stack: ['Node.js', 'ExpressJS', 'JavaScript', 'Nodemailer', 'Gmail'],
      images: [],
      coverImage: null,
      projectLink: 'Link Privado',
      codeLink: 'https://github.com/EleazarGamezD/Mailer-Pf',
      featured: true,
      status: 'published',
      publishedAt: '2025-01-01',
    },
    {
      slug: 'notes-app',
      title: { es: 'Notes App', en: 'Notes App' },
      summary: {
        es: 'API backend para manejo de notas tipo post-it con usuarios.',
        en: 'Backend API for post-it style notes with users.',
      },
      description: {
        es: 'API backend para manejo de notas tipo post-it con usuarios, CRUD completo de notas y manejo de categorias.',
        en: 'Backend API for post-it style notes with users, full notes CRUD, and category management.',
      },
      stack: ['Node.js', 'ExpressJS', 'JavaScript', 'MongoDB', 'JWT', 'HTML', 'CSS'],
      images: [],
      coverImage: null,
      projectLink: 'https://back-app-notas.vercel.app/',
      codeLink: 'https://github.com/EleazarGamezD/back-app-notas',
      featured: true,
      status: 'published',
      publishedAt: '2025-01-01',
    },
    {
      slug: 'tu-bodega-api',
      title: { es: 'Tu Bodega API', en: 'Tu Bodega API' },
      summary: {
        es: 'API de e-commerce escalable con usuarios, roles y productos.',
        en: 'Scalable e-commerce API with users, roles, and products.',
      },
      description: {
        es: 'API de e-commerce escalable con usuarios, roles, productos, carrito por usuario, control de compras, base de datos Postgres y autenticacion segura.',
        en: 'Scalable e-commerce API with users, roles, products, user cart, purchase flow, Postgres database, and secure authentication.',
      },
      stack: ['Node.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'TypeORM', 'JWT', 'Swagger'],
      images: [],
      coverImage: null,
      projectLink: 'https://tu-bodega.vercel.app/',
      codeLink: 'https://github.com/EleazarGamezD/Tu-Bodega',
      featured: true,
      status: 'published',
      publishedAt: '2025-01-01',
    },
  ];

  const techSkills = [
    ['angular', 'Angular', '/assets/images/shared/svg/angular-svgrepo-com.svg'],
    ['bootstrap', 'Bootstrap', '/assets/images/shared/svg/bootstrap-svgrepo-com.svg'],
    ['node-express', 'Node.js - Express', '/assets/images/shared/svg/node-js-svgrepo-com.svg'],
    ['docker', 'Docker', '/assets/images/shared/svg/docker-svgrepo-com.svg'],
    ['nestjs', 'Nest.js', '/assets/images/shared/svg/nestjs-svgrepo-com.svg'],
    ['postman', 'Postman', '/assets/images/shared/svg/postman-icon-svgrepo-com.svg'],
    ['typescript', 'TypeScript', '/assets/images/shared/svg/typescript-logo-svgrepo-com.svg'],
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
    ['l4-ventures-llc', '2025 - Actual', 'L4 Ventures LLC', 'Desarrollador Fullstack, desarrollo de aplicaciones web.', 'Fullstack developer, web application development.'],
    ['meraki-office', '2024 - 2025', 'Meraki Office', 'Desarrollador Fullstack, creacion de marketplace, integracion de pasarelas de pago, chats y plataformas de logistica.', 'Fullstack developer, marketplace creation, payment gateway integration, chat systems, and logistics platform integrations.'],
    ['freelance', '2023 - Actual', 'Freelance', 'Desarrollador Fullstack en proyectos personalizados.', 'Fullstack developer for custom projects.'],
    ['postouch-colombia', '2018 - 2023', 'PosTouch Colombia S.A.S', 'Jefe de departamento tecnico, soporte a sistemas fiscales y contables.', 'Technical department lead, support for fiscal and accounting systems.'],
    ['retail-pos-systems', '2013 - 2018', 'Retail Pos Systems Tec. C.A.', 'Jefe de departamento tecnico, soporte a sistemas fiscales y contables.', 'Technical department lead, support for fiscal and accounting systems.'],
  ].map(([slug, year, company, descriptionEs, descriptionEn], index) => ({
    slug,
    label: { es: company, en: company },
    title: { es: company, en: company },
    description: { es: descriptionEs, en: descriptionEn },
    value: year,
    icon: null,
    href: '',
    order: index + 1,
    active: true,
    metadata: { year },
    fileName: '',
    mimeType: '',
    base64: '',
  }));

  const testimonials = [
    ['arian-valdivieso', 'Arian Valdivieso', 'COO', 'Meraki Office', 'Eleazar demostró ser un miembro excepcional del equipo, destacándose por su naturaleza proactiva y sus notables habilidades de adaptación. Su compromiso con los proyectos y entusiasmo por aprender contribuyó significativamente a nuestro éxito en Meraki.', 'Eleazar proved to be an exceptional team member, standing out for his proactive nature and remarkable adaptive abilities. His commitment to projects and eagerness to learn significantly contributed to our success at Meraki.'],
    ['wilhelm-flores', 'Wilhelm Flores', 'Full Stack Developer', 'Meraki Office', 'Eleazar es un excelente solucionador de problemas. Su capacidad para pensar fuera de lo convencional y proponer soluciones escalables fue clave para el éxito de nuestros proyectos.', 'Eleazar is an excellent problem solver. His ability to think outside the conventional and propose scalable solutions was key to the success of our projects.'],
    ['elvis-garcia', 'Elvis Garcia', 'Backend Developer / DevOps', 'Meraki Office', 'Trabajé con Eleazar resolviendo problemas técnicos de forma eficiente y profesional. Durante nuestro tiempo juntos, demostró ser sumamente efectivo generando soluciones escalables y robustas para el equipo.', 'I worked with Eleazar solving technical problems efficiently and professionally. During our time together, he proved to be extremely effective at generating scalable and robust solutions for the team.'],
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
    ['github', 'GitHub', 'https://github.com/EleazarGamezD', 'fa-brands fa-github'],
    ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/eleazar-gamez/', 'fa-brands fa-linkedin'],
    ['x', 'X', 'https://x.com/Eleazar_Gamez', 'fa-brands fa-x-twitter'],
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

  const profile = {
    key: 'main-profile',
    slug: 'main-profile',
    label: { es: 'Eleazar Gamez', en: 'Eleazar Gamez' },
    title: {
      es: 'Entre interfaces y logica: transformando ideas en experiencias con alma fullstack.',
      en: 'Between interfaces and logic: transforming ideas into experiences with a fullstack soul.',
    },
    description: {
      es: 'Soy un desarrollador FullStack con un corazon dividido entre la creatividad del frontend y la logica robusta del backend. Mi expertise abarca la construccion de aplicaciones web dinamicas y escalables, utilizando Angular para dar vida a interfaces intuitivas, mientras que en el backend domino el arte de disenar APIs eficientes con NestJS y Express, asegurando arquitecturas limpias y mantenibles.',
      en: 'I am a FullStack developer with a heart split between frontend creativity and solid backend logic. My expertise covers building dynamic and scalable web applications, using Angular to craft intuitive interfaces, while on the backend I design efficient APIs with NestJS and Express, ensuring clean and maintainable architectures.',
    },
    availability: 'Open to new projects',
    location: 'Working remotely from Colombia',
    email: '',
    phone: '',
    metadata: {
      about: {
        es: 'Me apasiona transformar desafios tecnicos en soluciones elegantes, siempre con un enfoque colaborativo y un compromiso por la calidad. Disfruto aprender constantemente, explorar nuevas herramientas y contribuir a proyectos que dejen un impacto positivo. Para mi, el codigo no solo es funcionalidad, sino tambien la oportunidad de crear algo con proposito.',
        en: 'I enjoy turning technical challenges into elegant solutions, always with a collaborative mindset and quality focus. I like learning continuously, exploring new tools, and contributing to projects that create positive impact. For me, code is not only functionality, but also an opportunity to build with purpose.',
      },
      heroSlides: [
        {
          title: { es: 'Desarrollador web', en: 'Web developer' },
          description: {
            es: 'Desarrollo soluciones web completas y escalables, combinando tecnologias frontend y backend para crear experiencias digitales robustas y orientadas a resultados, con un enfoque centrado en el usuario.',
            en: 'I build complete and scalable web solutions, combining frontend and backend technologies to create robust digital experiences focused on outcomes and user needs.',
          },
          image: '/assets/images/shared/backgrounds/bg-1.webp',
        },
        {
          title: { es: 'Desarrollador backend', en: 'Backend developer' },
          description: {
            es: 'Diseno e implemento soluciones backend eficientes: APIs RESTful, gestion de bases de datos y desarrollo de microservicios con Node.js, NestJS y tecnologias cloud.',
            en: 'I design and implement efficient backend solutions: RESTful APIs, database management, and microservices development with Node.js, NestJS, and cloud technologies.',
          },
          image: '/assets/images/shared/backgrounds/keyboard.webp',
        },
        {
          title: { es: 'Desarrollador frontend', en: 'Frontend developer' },
          description: {
            es: 'Creo interfaces de usuario dinamicas y responsivas con Angular, usando componentes reutilizables y metodologias modernas. Me enfoco en rendimiento, accesibilidad y experiencia de usuario.',
            en: 'I create dynamic and responsive user interfaces with Angular, using reusable components and modern methodologies. I focus on performance, accessibility, and user experience.',
          },
          image: '/assets/images/shared/backgrounds/wallpaperflare.jpg',
        },
      ],
    },
  };

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

  await db.collection('profile').deleteMany({ key: 'main-profile' });
  await db.collection('profile').insertOne({ ...profile, createdAt: now, updatedAt: now });

  console.log('Initial content seeded successfully.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed initial content:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
