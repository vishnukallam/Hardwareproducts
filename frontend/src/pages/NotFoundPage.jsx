import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 page-enter">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <p className="font-display text-8xl font-black text-primary/20 mb-2">404</p>
      <h1 className="font-display text-2xl font-bold text-white mb-3">Page Not Found</h1>
      <p className="text-on-surface-variant font-body mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist. It may have been moved or deleted.
      </p>
      <Link to="/" className="m3-btn-primary">
        Go Home
      </Link>
    </motion.div>
  </div>
);

export default NotFoundPage;
