import {
  LayoutDashboard,
  Award,
  Sparkles,
  Users,
  BarChart3,
  ScanLine,
  ClipboardCheck,
  Trophy,
  Settings,
  ShieldAlert,
  UploadCloud,
  History,
} from 'lucide-react';

/**
 * Role definitions and permission matrix for Mavericks Certify.
 * Two roles only:
 *   - Maverick: the employee earning credentials.
 *   - L&D Manager: the platform admin (issues certs, approves submissions,
 *     manages users, runs fraud detection, owns analytics).
 */
export const ROLES = {
  MAVERICK: 'maverick',
  LND_MANAGER: 'lnd_manager',
};

export const ROLE_META = {
  [ROLES.MAVERICK]: {
    label: 'Maverick',
    tagline: 'Fresher / New Joiner',
    tone: 'electric',
    color: '#2f80ff',
    home: '/app/overview',
  },
  [ROLES.LND_MANAGER]: {
    label: 'L&D Manager',
    tagline: 'Learning & Development',
    tone: 'violet',
    color: '#8b5cf6',
    home: '/app/admin',
  },
};

/**
 * Capability flags per role. Used by route guards and conditional UI.
 */
export const PERMISSIONS = {
  [ROLES.MAVERICK]: ['view_own_certs', 'download_certs', 'view_leaderboard', 'verify', 'submit_certs'],
  [ROLES.LND_MANAGER]: [
    'generate_certs',
    'bulk_generate',
    'approve_requests',
    'view_analytics',
    'fraud_detection',
    'manage_users',
    'system_settings',
    'verify',
    'view_leaderboard',
  ],
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
    roles: [ROLES.LND_MANAGER],
  },
  {
    to: '/app/certificates',
    label: 'My Certificates',
    icon: Award,
    roles: [ROLES.MAVERICK],
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
    roles: [ROLES.LND_MANAGER],
    perm: 'generate_certs',
  },
  {
    to: '/app/approvals',
    label: 'Approval Queue',
    icon: ClipboardCheck,
    roles: [ROLES.LND_MANAGER],
    perm: 'approve_requests',
  },
  {
    to: '/app/fraud',
    label: 'Fraud Detection',
    icon: ShieldAlert,
    roles: [ROLES.LND_MANAGER],
    perm: 'fraud_detection',
  },
  {
    to: '/app/verify',
    label: 'Verify Portal',
    icon: ScanLine,
    roles: [ROLES.MAVERICK, ROLES.LND_MANAGER],
  },
  {
    to: '/app/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: [ROLES.LND_MANAGER],
    perm: 'view_analytics',
  },
  {
    to: '/app/leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    roles: [ROLES.MAVERICK, ROLES.LND_MANAGER],
  },
  {
    to: '/app/users',
    label: 'User Management',
    icon: Users,
    roles: [ROLES.LND_MANAGER],
    perm: 'manage_users',
  },
  {
    to: '/app/settings',
    label: 'Settings',
    icon: Settings,
    roles: [ROLES.MAVERICK, ROLES.LND_MANAGER],
  },
];

export function navForRole(role) {
  return NAV_ITEMS.filter(
    (item) => item.roles.includes(role) && (!item.perm || hasPermission(role, item.perm))
  );
}
