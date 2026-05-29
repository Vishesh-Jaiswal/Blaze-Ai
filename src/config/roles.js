import {
  LayoutDashboard,
  Award,
  Sparkles,
  ShieldCheck,
  Users,
  BarChart3,
  ScanLine,
  ClipboardCheck,
  Trophy,
  FileStack,
  Settings,
  ShieldAlert,
  UploadCloud,
  History,
} from 'lucide-react';

/**
 * Role definitions and permission matrix for Mavericks Certify.
 * Each role gets its own dashboard surface, navigation and capabilities.
 */
export const ROLES = {
  MAVERICK: 'maverick',
  HR_ADMIN: 'hr_admin',
  LND_MANAGER: 'lnd_manager',
  SUPER_ADMIN: 'super_admin',
  VERIFIER: 'verifier',
};

export const ROLE_META = {
  [ROLES.MAVERICK]: {
    label: 'Maverick',
    tagline: 'Fresher / New Joiner',
    tone: 'electric',
    color: '#2f80ff',
    home: '/app/overview',
  },
  [ROLES.HR_ADMIN]: {
    label: 'HR Admin',
    tagline: 'Human Resources',
    tone: 'cyan',
    color: '#06c8ff',
    home: '/app/admin',
  },
  [ROLES.LND_MANAGER]: {
    label: 'L&D Manager',
    tagline: 'Learning & Development',
    tone: 'violet',
    color: '#8b5cf6',
    home: '/app/admin',
  },
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    tagline: 'Platform Owner',
    tone: 'success',
    color: '#10b981',
    home: '/app/admin',
  },
  [ROLES.VERIFIER]: {
    label: 'External Verifier',
    tagline: 'Client / Partner',
    tone: 'warning',
    color: '#f59e0b',
    home: '/app/verify',
  },
};

/**
 * Capability flags per role. Used by route guards and conditional UI.
 */
export const PERMISSIONS = {
  [ROLES.MAVERICK]: ['view_own_certs', 'download_certs', 'view_leaderboard', 'verify', 'submit_certs'],
  [ROLES.HR_ADMIN]: [
    'view_own_certs',
    'download_certs',
    'generate_certs',
    'bulk_generate',
    'approve_requests',
    'view_analytics',
    'manage_users',
    'verify',
    'view_leaderboard',
  ],
  [ROLES.LND_MANAGER]: [
    'generate_certs',
    'bulk_generate',
    'approve_requests',
    'view_analytics',
    'fraud_detection',
    'verify',
    'view_leaderboard',
  ],
  [ROLES.SUPER_ADMIN]: [
    'view_own_certs',
    'download_certs',
    'generate_certs',
    'bulk_generate',
    'approve_requests',
    'view_analytics',
    'manage_users',
    'fraud_detection',
    'system_settings',
    'verify',
    'view_leaderboard',
  ],
  [ROLES.VERIFIER]: ['verify'],
};

export function hasPermission(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission);
}

/**
 * Navigation items. `roles` lists which roles see the item.
 * `perm` (optional) further gates by permission.
 */
export const NAV_ITEMS = [
  {
    to: '/app/overview',
    label: 'My Overview',
    icon: LayoutDashboard,
    roles: [ROLES.MAVERICK],
  },
  {
    to: '/app/admin',
    label: 'Command Center',
    icon: LayoutDashboard,
    roles: [ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN],
  },
  {
    to: '/app/certificates',
    label: 'My Certificates',
    icon: Award,
    roles: [ROLES.MAVERICK, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    to: '/app/submit',
    label: 'Submit Certificate',
    icon: UploadCloud,
    roles: [ROLES.MAVERICK],
    perm: 'submit_certs',
  },
  {
    to: '/app/submissions',
    label: 'My Submissions',
    icon: History,
    roles: [ROLES.MAVERICK],
    perm: 'submit_certs',
  },
  {
    to: '/app/generate',
    label: 'AI Generator',
    icon: Sparkles,
    roles: [ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN],
    perm: 'generate_certs',
  },
  {
    to: '/app/approvals',
    label: 'Approval Queue',
    icon: ClipboardCheck,
    roles: [ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN],
    perm: 'approve_requests',
  },
  {
    to: '/app/fraud',
    label: 'Fraud Detection',
    icon: ShieldAlert,
    roles: [ROLES.LND_MANAGER, ROLES.SUPER_ADMIN],
    perm: 'fraud_detection',
  },
  {
    to: '/app/verify',
    label: 'Verify Portal',
    icon: ScanLine,
    roles: [ROLES.MAVERICK, ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN, ROLES.VERIFIER],
  },
  {
    to: '/app/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: [ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN],
    perm: 'view_analytics',
  },
  {
    to: '/app/leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    roles: [ROLES.MAVERICK, ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN],
  },
  {
    to: '/app/users',
    label: 'User Management',
    icon: Users,
    roles: [ROLES.HR_ADMIN, ROLES.SUPER_ADMIN],
    perm: 'manage_users',
  },
  {
    to: '/app/settings',
    label: 'Settings',
    icon: Settings,
    roles: [ROLES.MAVERICK, ROLES.HR_ADMIN, ROLES.LND_MANAGER, ROLES.SUPER_ADMIN, ROLES.VERIFIER],
  },
];

export function navForRole(role) {
  return NAV_ITEMS.filter(
    (item) => item.roles.includes(role) && (!item.perm || hasPermission(role, item.perm))
  );
}
