import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import WhatsAppSupport from './WhatsAppSupport';
import { useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  // List of routes where the footer should be hidden
  const hideFooterRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard',
    '/checkout',
    '/country',
    '/bundle',
    '/how-it-works',
    '/about',
    '/admin',
    '/admin-login',
    '/balance',
    '/packages'
  ];
  const hideFooter = hideFooterRoutes.some(route => location.pathname.startsWith(route));

  const showStickyCTA = ['/','/checkout'].includes(location.pathname);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* Blurred background element */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 blur-3xl" />
      
      <Toaster />
      <Header />
      <main className="flex-grow pt-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideFooter && <Footer />}
      <WhatsAppSupport phoneNumber="+1234567890" /> {/* Replace with actual WhatsApp number */}
      {showStickyCTA && (
        <AnimatePresence>
          <motion.div
            key="sticky-cta"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4 pointer-events-none"
          >
            <div className="pointer-events-auto">
              <Link to="/checkout">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg text-lg active:scale-95 transition-transform">
                  Buy Now
                </button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Layout;