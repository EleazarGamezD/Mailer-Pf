import { randomBytes } from 'node:crypto';
import path from 'node:path';
import url from 'node:url';

import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';

import { getDatabase } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AdminRoleEnum } from '../../core/enums/admin-role.enum.js';
import { DatabaseCollectionEnum } from '../../core/enums/database-collection.enum.js';
import type { AdminUserDocument, PasswordResetTokenDocument } from '../../core/interfaces/domain.js';
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
    mustChangePassword: adminUser.mustChangePassword === true,
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

// ─── First-login account setup ───────────────────────────────────────────────

export interface SetupAccountPayload {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export async function setupAdminAccount(currentUserId: string, payload: SetupAccountPayload) {
  const db = getDatabase();
  const { ObjectId } = await import('mongodb');

  if (!ObjectId.isValid(currentUserId)) {
    throw createHttpError(400, 'Invalid user id.');
  }

  const caller = await db.collection<AdminUserDocument>(DatabaseCollectionEnum.ADMIN_USERS).findOne({
    _id: new ObjectId(currentUserId),
  });

  if (!caller || !caller.mustChangePassword) {
    throw createHttpError(403, 'This account does not require setup.');
  }

  const { email, username, displayName, password } = payload;

  if (!email || !username || !displayName || !password) {
    throw createHttpError(400, 'email, username, displayName and password are required.');
  }

  if (password.length < 8) {
    throw createHttpError(400, 'password must contain at least 8 characters.');
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);

  const newUser: AdminUserDocument = {
    email: email.trim().toLowerCase(),
    username: username.trim().toLowerCase(),
    displayName: displayName.trim(),
    passwordHash,
    role: AdminRoleEnum.SUPER_ADMIN,
    active: true,
    mustChangePassword: false,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await db.collection(DatabaseCollectionEnum.ADMIN_USERS).insertOne(newUser);

  // Delete the bootstrap user
  await db.collection(DatabaseCollectionEnum.ADMIN_USERS).deleteOne({ _id: new ObjectId(currentUserId) });

  const accessToken = signAdminToken({
    sub: String(insertedId),
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
  });

  return {
    configured: true,
    accessToken,
    tokenType: 'Bearer',
    user: sanitizeAdminUser({ ...newUser, _id: insertedId }),
  };
}

// ─── Password reset ──────────────────────────────────────────────────────────

function createMailTransport() {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.gmailUser, pass: env.gmailPassword },
  });

  const templateDir = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    '..',
    '..',
    'templates',
  );

  transport.use(
    'compile',
    hbs({
      viewEngine: {
        extname: '.hbs',
        partialsDir: templateDir,
        defaultLayout: false,
      },
      viewPath: templateDir,
      extName: '.hbs',
    }),
  );

  return transport;
}

export async function requestPasswordReset(email: string) {
  const db = getDatabase();
  const user = await db.collection<AdminUserDocument>(DatabaseCollectionEnum.ADMIN_USERS).findOne({
    email: email.trim().toLowerCase(),
  });

  // Always respond success to avoid user enumeration
  if (!user || !user.active) {
    return { sent: true };
  }

  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const tokenDoc: PasswordResetTokenDocument = {
    adminUserId: String(user._id),
    token,
    expiresAt,
    used: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(DatabaseCollectionEnum.PASSWORD_RESET_TOKENS).insertOne(tokenDoc);

  const resetUrl = `${env.frontendUrl}/admin/reset-password?token=${token}`;

  const transport = createMailTransport();
  await transport.sendMail({
    from: env.mailFrom,
    to: user.email,
    subject: 'Recupera tu contrasena | Portfolio CMS',
    // @ts-expect-error nodemailer-express-handlebars augments the options
    template: 'passwordReset',
    context: {
      displayName: user.displayName,
      resetUrl,
      year: new Date().getFullYear(),
    },
  });

  return { sent: true };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const db = getDatabase();

  if (!token || !newPassword) {
    throw createHttpError(400, 'token and newPassword are required.');
  }

  if (newPassword.length < 8) {
    throw createHttpError(400, 'newPassword must contain at least 8 characters.');
  }

  const tokenDoc = await db.collection<PasswordResetTokenDocument>(
    DatabaseCollectionEnum.PASSWORD_RESET_TOKENS,
  ).findOne({ token });

  if (!tokenDoc || tokenDoc.used || tokenDoc.expiresAt < new Date()) {
    throw createHttpError(400, 'Invalid or expired reset token.');
  }

  const { ObjectId } = await import('mongodb');

  if (!ObjectId.isValid(tokenDoc.adminUserId)) {
    throw createHttpError(400, 'Invalid token data.');
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await db.collection(DatabaseCollectionEnum.ADMIN_USERS).updateOne(
    { _id: new ObjectId(tokenDoc.adminUserId) },
    { $set: { passwordHash, updatedAt: now } },
  );

  await db.collection(DatabaseCollectionEnum.PASSWORD_RESET_TOKENS).updateOne(
    { token },
    { $set: { used: true } },
  );

  return { reset: true };
}
