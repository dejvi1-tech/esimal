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
    <div className="relative min-h-screen flex flex-col bg-[#4B0082] text-white">
      <Toaster />
      <Header />
      <main className="flex-grow pt-20 w-full">
        <div className="w-full">
          {children}
        </div>
      </main>
      {!hideFooter && <Footer />}
      <WhatsAppSupport phoneNumber="+1234567890" /> {/* Replace with actual WhatsApp number */}
    </div>
  );
};

export default Layout;