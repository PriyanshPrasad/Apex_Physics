import { Link } from "react-router";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <div className="clay max-w-md p-10 text-center">
        <p className="text-6xl font-black tracking-tight text-[var(--clay-primary-deep)]">404</p>
        <p className="mt-3 text-lg font-extrabold">This page escaped the system boundary.</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Even in a closed system, momentum is conserved — you'll just have to redirect it.
        </p>
        <Link to="/" className="clay-btn clay-press mt-6 inline-block px-6 py-3 text-sm font-extrabold">
          Back to home
        </Link>
      </div>
    </motion.div>
  );
}
