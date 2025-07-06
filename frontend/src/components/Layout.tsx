import React from 'react';
import Header from './Header';
import Footer from './Footer';
import WhatsAppSupport from './WhatsAppSupport';
import { useLocation } from 'react-router-dom';
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

  return (
    <div 
      className="relative min-h-screen flex flex-col bg-[#4B0082] text-white overflow-x-hidden scroll-container"
      style={{
        /* Performance optimizations */
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'scroll-position',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Toaster />
      <Header />
      <main 
        className="flex-grow pt-20"
        style={{
          /* Performance optimizations for main content */
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'auto'
        }}
      >
        <div className="h-full">
          {children}
        </div>
      </main>
      {!hideFooter && <Footer />}
      <WhatsAppSupport phoneNumber="+1234567890" /> {/* Replace with actual WhatsApp number */}
    </div>
  );
};

export default Layout;