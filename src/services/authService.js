import { delay } from '@/lib/utils';
import { DEMO_USERS } from '@/data/mockData';

/**
 * Mock authentication service simulating a JWT-based backend.
 * Tokens are fake but structurally realistic (header.payload.signature, base64url).
 */

const STORAGE_KEY = 'mc.session';
const USERS_KEY = 'mc.users';

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
    if (stored?.length) return stored;
  } catch (_) {}
  localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  return DEMO_USERS;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  // Demo mode: accept the seeded password, or any password for seeded demo accounts.
  if (user.password && password !== user.password && !DEMO_USERS.some((d) => d.email === user.email)) {
    throw new Error('Incorrect password. Please try again.');
  }
  const token = mintToken(user);
  const session = { token, user: sanitize(user), issuedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
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
  return { sent: true };
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
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
