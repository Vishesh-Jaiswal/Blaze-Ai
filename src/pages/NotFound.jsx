import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ScanLine } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-8xl font-bold text-gradient-electric"
      >
        404
      </motion.h1>
      <p className="mt-4 font-display text-2xl font-semibold text-white">Page not found</p>
      <p className="mt-2 max-w-md text-slate-400">
        The credential or page you’re looking for doesn’t exist or has moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/"><Button icon={Home}>Back home</Button></Link>
        <Link to="/app/verify"><Button variant="secondary" icon={ScanLine}>Verify a certificate</Button></Link>
      </div>
    </div>
  );
}
