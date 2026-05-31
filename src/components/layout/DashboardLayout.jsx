import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { NAV_ITEMS, ROLES } from '@/config/roles';
import { useAuthStore } from '@/store/authStore';

function titleForPath(pathname) {
  const match = NAV_ITEMS.find((i) => pathname.startsWith(i.to));
  return match?.label || 'Dashboard';
}

const TOUR_KEY = (userId) => `mc.tour.${userId}`;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const location = useLocation();
  const title = titleForPath(location.pathname);
  const user = useAuthStore((s) => s.user);

  // Auto-open the onboarding tour for newly-created Maverick accounts.
  useEffect(() => {
    if (!user || user.role !== ROLES.MAVERICK) return;
    try {
      if (localStorage.getItem(TOUR_KEY(user.id)) === 'pending') {
        setTourOpen(true);
      }
    } catch (_) {}
  }, [user]);

  const closeTour = () => {
    setTourOpen(false);
    try {
      if (user?.id) localStorage.setItem(TOUR_KEY(user.id), 'done');
    } catch (_) {}
  };

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72">
        <Topbar onMenu={() => setMobileOpen(true)} title={title} />
        <main className="px-4 py-6 md:px-8 md:py-8">
          {/* Re-keying on pathname forces the motion.div to remount per route,
              replaying the fade-in. No AnimatePresence + mode="wait" because
              an interrupted exit could leave the slot blank until refresh. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <OnboardingTour open={tourOpen} onClose={closeTour} />
    </div>
  );
}
