import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { scrollToTop } from '@/utils/scrollUtils';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t, language } = useLanguage();

  const handleScrollToTop = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      // Use the new scroll utility
      scrollToTop('smooth');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="w-full px-4">
        <div className="navbar-glassmorphism-fixed">
          <div className="flex items-center justify-between h-[4.5rem] gap-x-10">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 group cursor-pointer"
              onClick={handleScrollToTop}
            >
              <div className="logo-container">
                <img
                  src="/images/new-airplane-logo.png"
                  alt="e-SimFly Logo"
                  className="h-14 w-14 object-contain rounded-2xl"
                  style={{ minWidth: 56 }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-white font-orbitron" style={{ letterSpacing: '0.01em' }}>
                  e-<span className="font-black">SimFly</span>
                </span>
                <span className="text-xs text-gray-200 font-medium font-orbitron">Global eSIM Solutions</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
                onClick={handleScrollToTop}
              >
                {t('nav_home')}
              </Link>
              <Link
                to="/packages"
                className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
              >
                {t('nav_packages')}
              </Link>
              <Link
                to="/how-it-works"
                className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
              >
                {t('nav_how_it_works')}
              </Link>
              <Link
                to="/about"
                className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
              >
                {t('nav_about')}
              </Link>
              <Link
                to="/support"
                className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
              >
                {t('nav_support')}
              </Link>
            </nav>

            {/* Language Toggle */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => language === 'en' ? t('switch_to_albanian') : t('switch_to_english')}
                className="text-white hover:text-blue-300 transition-colors duration-200 text-sm font-medium"
              >
                {language === 'en' ? 'SQ' : 'EN'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white glass">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 navbar-mobile-glassmorphism">
                <div className="flex items-center justify-between mb-8">
                  <Link
                    to="/"
                    className="flex items-center space-x-3 group cursor-pointer"
                    onClick={(e) => {
                      setIsOpen(false);
                      handleScrollToTop(e);
                    }}
                  >
                    <img
                      src="/logo.png"
                      alt="e-SimFly Logo"
                      className="h-14 w-14 object-contain"
                      style={{ minWidth: 56 }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold tracking-tight text-white">
                        e-<span className="font-black">SimFly</span>
                      </span>
                      <span className="text-xs text-gray-200 font-medium">Global eSIM Solutions</span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-4">
                  <Link
                    to="/"
                    className="block text-white hover:text-blue-300 transition-colors duration-200 font-medium py-2"
                    onClick={() => {
                      setIsOpen(false);
                      if (location.pathname === "/") {
                        scrollToTop('smooth');
                      }
                    }}
                  >
                    {t('nav_home')}
                  </Link>
                  <Link
                    to="/packages"
                    className="block text-white hover:text-blue-300 transition-colors duration-200 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav_packages')}
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="block text-white hover:text-blue-300 transition-colors duration-200 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav_how_it_works')}
                  </Link>
                  <Link
                    to="/about"
                    className="block text-white hover:text-blue-300 transition-colors duration-200 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav_about')}
                  </Link>
                  <Link
                    to="/support"
                    className="block text-white hover:text-blue-300 transition-colors duration-200 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav_support')}
                  </Link>
                </nav>

                {/* Mobile Language Toggle */}
                <div className="mt-8 pt-4 border-t border-white/20">
                  <button
                    onClick={() => {
                      language === 'en' ? t('switch_to_albanian') : t('switch_to_english');
                      setIsOpen(false);
                    }}
                    className="text-white hover:text-blue-300 transition-colors duration-200 text-sm font-medium"
                  >
                    {language === 'en' ? 'Switch to Albanian' : 'Switch to English'}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;