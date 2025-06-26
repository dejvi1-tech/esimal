import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  const navigationItems = [
    { name: t('packages'), href: '/packages' },
    { name: t('check_balance'), href: '/balance' },
    { name: t('how_it_works'), href: '/how-it-works' },
    { name: t('about_us'), href: '/about' },
    { name: t('support'), href: '/support' }
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="ios-banner">
          <div className="flex items-center justify-between h-[4.5rem] gap-x-10">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 group cursor-pointer"
              onClick={e => {
                if (location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <div className="glass-logo no-bg">
                <img
                  src="/images/new-airplane-logo.png"
                  alt="e-SimFly Logo"
                  className="h-14 w-14 object-contain drop-shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-xl rounded-2xl"
                  style={{ minWidth: 56 }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-orbitron" style={{ letterSpacing: '0.01em' }}>
                  e-<span className="font-black">SimFly</span>
                </span>
                <span className="text-xs text-gray-500 font-medium font-orbitron">Global eSIM Solutions</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 group ${
                    location.pathname === item.href 
                      ? 'text-blue-600 bg-blue-50 shadow-sm' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}>
                  {item.name}
                  {location.pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                size="sm"
              >
                {t('hero_cta_main')}
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white/95 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                  <Link
                    to="/"
                    className="flex items-center space-x-3 group cursor-pointer"
                    onClick={e => {
                      if (location.pathname === "/") {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    <img
                      src="/logo.png"
                      alt="e-SimFly Logo"
                      className="h-14 w-14 object-contain drop-shadow-md transition-transform group-hover:scale-105"
                      style={{ minWidth: 56 }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        e-<span className="font-black">SimFly</span>
                      </span>
                      <span className="text-xs text-gray-500 font-medium">Global eSIM Solutions</span>
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-gray-100">
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        location.pathname === item.href 
                          ? 'text-blue-600 bg-blue-50 shadow-sm' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsOpen(false)}>
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <div className="mt-8 space-y-4">
                  <LanguageSwitcher />
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    size="sm"
                  >
                    {t('hero_cta_main')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;