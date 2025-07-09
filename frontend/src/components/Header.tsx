import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="w-full px-4">
        <div className="navbar-glassmorphism-fixed">
          <div className="flex items-center justify-between h-[4.5rem] gap-x-10">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              {/* Panda Logo */}
              <div className="flex items-center justify-center bg-gradient-to-br from-purple-700 via-purple-500 to-indigo-600 shadow-lg rounded-2xl p-1 mr-2" style={{ height: 64, width: 64, minWidth: 64 }}>
                <img
                  src="/pandalogo.png"
                  alt="Panda Logo"
                  className="h-14 w-14 object-contain rounded-xl drop-shadow-md"
                  style={{ background: 'rgba(80, 0, 120, 0.15)' }}
                />
              </div>
              {/* Brand Name and Subtitle */}
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-white font-orbitron" style={{ letterSpacing: '0.01em' }}>
                  e-<span className="font-black">SimFly</span>
                </span>
                <span className="text-xs text-gray-200 font-medium font-orbitron">Global eSIM Solutions</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-lg font-medium glass ${
                    location.pathname === item.href 
                      ? 'bg-glass-medium' 
                      : 'bg-glass'
                  }`}>
                  {item.name}
                  {location.pathname === item.href && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <Button 
                className="btn-glass bg-accent text-accent-foreground font-semibold"
                size="sm"
              >
                {t('hero_cta_main')}
              </Button>
            </div>

            {/* Mobile Menu */}
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
                    onClick={e => {
                      if (location.pathname === "/") {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'auto' });
                      }
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
                </div>
                
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block w-full text-left px-4 py-3 rounded-lg font-medium glass ${
                        location.pathname === item.href 
                          ? 'bg-glass-medium' 
                          : 'bg-glass'
                      }`}
                      onClick={() => setIsOpen(false)}>
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <div className="mt-8 space-y-4">
                  <LanguageSwitcher />
                  <Button 
                    className="w-full btn-glass bg-accent text-accent-foreground font-semibold"
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
    </header>
  );
};

export default Header;