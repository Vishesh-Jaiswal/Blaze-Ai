import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROLES, ROLE_META } from '@/config/roles';
import { bootstrap } from '@/lib/db';
import Spinner from '@/components/ui/Spinner';

import AnimatedBackground from '@/components/background/AnimatedBackground';
import CursorGlow from '@/components/background/CursorGlow';
import Toaster from '@/components/ui/Toaster';
import ProtectedRoute from '@/routes/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import OtpVerification from '@/pages/auth/OtpVerification';
import PublicVerify from '@/pages/PublicVerify';
import NotFound from '@/pages/NotFound';

import MaverickDashboard from '@/pages/app/MaverickDashboard';
import AdminDashboard from '@/pages/app/AdminDashboard';
import MyCertificates from '@/pages/app/MyCertificates';
import SubmitCertificate from '@/pages/app/SubmitCertificate';
import MySubmissions from '@/pages/app/MySubmissions';
import CertificateGenerator from '@/pages/app/CertificateGenerator';
import ApprovalQueue from '@/pages/app/ApprovalQueue';
import FraudDetection from '@/pages/app/FraudDetection';
import VerificationPortal from '@/pages/app/VerificationPortal';
import Analytics from '@/pages/app/Analytics';
import Leaderboard from '@/pages/app/Leaderboard';
import UserManagement from '@/pages/app/UserManagement';
import Settings from '@/pages/app/Settings';

/** Redirects /app to the signed-in user's role home. */
function RoleHome() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={ROLE_META[user.role]?.home || '/app/verify'} replace />;
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  const [ready, setReady] = useState(false);

  // Pull disk-persisted data into localStorage before the auth store reads
  // the session — otherwise the session would point at a user that hasn't
  // been mirrored in yet on a fresh clone.
  useEffect(() => {
    bootstrap().finally(() => {
      init();
      setReady(true);
    });
  }, [init]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <CursorGlow />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/verify" element={<PublicVerify />} />

        {/* Authenticated app */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleHome />} />
          <Route path="overview" element={<ProtectedRoute roles={[ROLES.MAVERICK]}><MaverickDashboard /></ProtectedRoute>} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={[ROLES.LND_MANAGER]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="submit" element={<ProtectedRoute permission="submit_certs"><SubmitCertificate /></ProtectedRoute>} />
          <Route path="submissions" element={<ProtectedRoute permission="submit_certs"><MySubmissions /></ProtectedRoute>} />
          <Route path="generate" element={<ProtectedRoute permission="generate_certs"><CertificateGenerator /></ProtectedRoute>} />
          <Route path="approvals" element={<ProtectedRoute permission="approve_requests"><ApprovalQueue /></ProtectedRoute>} />
          <Route path="fraud" element={<ProtectedRoute permission="fraud_detection"><FraudDetection /></ProtectedRoute>} />
          <Route path="verify" element={<VerificationPortal />} />
          <Route path="analytics" element={<ProtectedRoute permission="view_analytics"><Analytics /></ProtectedRoute>} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="users" element={<ProtectedRoute permission="manage_users"><UserManagement /></ProtectedRoute>} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </>
  );
}
