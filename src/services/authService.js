import { delay } from '@/lib/utils';
import { DEMO_USERS } from '@/data/mockData';
import { ROLES } from '@/config/roles';
import { notifyChange } from '@/lib/db';

/**
 * Mock authentication service simulating a JWT-based backend.
 * Tokens are fake but structurally realistic (header.payload.signature, base64url).
 */

const STORAGE_KEY = 'mc.session';
const USERS_KEY = 'mc.users';

const VALID_ROLES = new Set(Object.values(ROLES));

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
    if (stored?.length) {
      // Drop any users whose role no longer exists in the role registry
      // (e.g. removed HR/Super/Verifier seeds from a previous app version).
      const cleaned = stored.filter((u) => VALID_ROLES.has(u.role));
      if (cleaned.length !== stored.length) {
        localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
        notifyChange('users');
      }
      return cleaned;
    }
  } catch (_) {}
  localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  notifyChange('users');
  return DEMO_USERS;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyChange('users');
}

function b64url(obj) {
  return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** Create a mock JWT for a user. */
function mintToken(user) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
  const signature = b64url({ s: `${user.id}-${Date.now()}` }).slice(0, 32);
  return `${header}.${payload}.${signature}`;
}

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

export async function login({ email, password }) {
  await delay(900);
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) throw new Error('No account found for that email.');

  // Demo convenience: accept any password ONLY while a seeded account still
  // has its untouched seed password. Once the user changes their password,
  // strict matching kicks in for everyone.
  const seedDefault = DEMO_USERS.find((d) => d.email.toLowerCase() === user.email.toLowerCase())?.password;
  const isUnchangedDemo = Boolean(seedDefault) && user.password === seedDefault;

  if (user.password && !isUnchangedDemo && password !== user.password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const token = mintToken(user);
  const session = { token, user: sanitize(user), issuedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * Change the password for a user. Validates the current password (using the
 * same demo-bypass rule as login) and writes the new one to the mock DB.
 */
export async function updatePassword({ email, currentPassword, newPassword }) {
  await delay(700);
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (idx === -1) throw new Error('Account not found.');
  const user = users[idx];

  const seedDefault = DEMO_USERS.find((d) => d.email.toLowerCase() === user.email.toLowerCase())?.password;
  const isUnchangedDemo = Boolean(seedDefault) && user.password === seedDefault;

  if (user.password && !isUnchangedDemo && currentPassword !== user.password) {
    throw new Error('Current password is incorrect.');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }
  if (newPassword === user.password) {
    throw new Error('New password must be different from the current one.');
  }

  const updated = { ...user, password: newPassword };
  users[idx] = updated;
  saveUsers(users);
  return { updated: true };
}

export async function signup({ name, email, password, role, department }) {
  await delay(1000);
  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    throw new Error('An account with this email already exists.');
  }
  const newUser = {
    id: `u-${Date.now().toString(36)}`,
    name,
    email: email.toLowerCase().trim(),
    password,
    role,
    department: department || 'Cloud Engineering',
    title: 'Maverick — Batch 2026',
    joinedAt: new Date().toISOString().slice(0, 10),
    avatar: null,
  };
  saveUsers([...users, newUser]);
  // Flag the new account for the onboarding tour on first login.
  try { localStorage.setItem(`mc.tour.${newUser.id}`, 'pending'); } catch (_) {}
  return { user: sanitize(newUser) };
}

/** Simulate sending an OTP — returns the code so the demo UI can display it. */
export async function requestOtp(email) {
  await delay(700);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem(`mc.otp.${email}`, code);
  return { sent: true, devCode: code };
}

export async function verifyOtp(email, code) {
  await delay(600);
  const expected = sessionStorage.getItem(`mc.otp.${email}`);
  if (!expected) throw new Error('OTP expired. Please request a new code.');
  if (String(code) !== expected) throw new Error('Invalid verification code.');
  sessionStorage.removeItem(`mc.otp.${email}`);
  return { verified: true };
}

export async function requestPasswordReset(email) {
  await delay(800);
  const users = loadUsers();
  if (!users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    throw new Error('No account found for that email.');
  }
  // Mint an OTP for the reset flow; the dev code surfaces in the page toast.
  const code = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem(`mc.otp.${email}`, code);
  return { sent: true, devCode: code };
}

/**
 * Verify the OTP and set a new password in one step. Used by the
 * forgot-password reset flow.
 */
export async function resetPasswordWithOtp({ email, code, newPassword }) {
  await delay(900);
  const expected = sessionStorage.getItem(`mc.otp.${email}`);
  if (!expected) throw new Error('Verification code expired. Please request a new one.');
  if (String(code) !== expected) throw new Error('Invalid verification code.');

  const users = loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (idx === -1) throw new Error('Account not found.');
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }

  users[idx] = { ...users[idx], password: newPassword };
  saveUsers(users);
  sessionStorage.removeItem(`mc.otp.${email}`);
  return { success: true };
}

/** Return all users (sanitized — no passwords). Optional `role` filter. */
export async function listUsers({ role } = {}) {
  await delay(200);
  let users = loadUsers();
  if (role) users = users.filter((u) => u.role === role);
  return users.map(sanitize);
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    // If the cached session belongs to a role we no longer support, treat
    // it as logged out so the user lands back at /login instead of crashing.
    if (session?.user && !VALID_ROLES.has(session.user.role)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}
