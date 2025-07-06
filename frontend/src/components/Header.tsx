import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  // Detect Safari
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  const navigationItems = [
    { name: t('packages'), href: '/packages' },
    { name: t('check_balance'), href: '/balance' },
    { name: t('how_it_works'), href: '/how-it-works' },
    { name: t('about_us'), href: '/about' },
    { name: t('support'), href: '/support' }
  ];

  // Safari-specific styles with enhanced fallbacks
  const safariNavbarStyle = {
    background: isSafari ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0 0 16px 16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateZ(0)',
    WebkitTransform: 'translateZ(0)',
    willChange: 'backdrop-filter',
    position: 'relative' as const,
    zIndex: 50,
    // Safari-specific additional properties
    ...(isSafari && {
      isolation: 'isolate',
      contain: 'layout style paint'
    })
  };

  const safariGlassStyle = {
    background: isSafari ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateZ(0)',
    WebkitTransform: 'translateZ(0)',
    willChange: 'backdrop-filter',
    // Safari-specific additional properties
    ...(isSafari && {
      isolation: 'isolate',
      contain: 'layout style paint'
    })
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="w-full px-4">
        <div 
          className="mx-auto max-w-7xl"
          style={safariNavbarStyle}
        >
          <div className="flex items-center justify-between h-[4.5rem] gap-x-10 px-6">
            {/* Logo */}
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
              <div 
                className="p-2"
                style={safariGlassStyle}
              >
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
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative px-4 py-2 rounded-lg font-medium"
                  style={{
                    ...safariGlassStyle,
                    background: location.pathname === item.href 
                      ? (isSafari ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.2)')
                      : (isSafari ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)')
                  }}
                >
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
                className="bg-accent text-accent-foreground font-semibold"
                size="sm"
                style={safariGlassStyle}
              >
                {t('hero_cta_main')}
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                  style={safariGlassStyle}
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-80"
                style={safariGlassStyle}
              >
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
                      className="block w-full text-left px-4 py-3 rounded-lg font-medium"
                      style={{
                        ...safariGlassStyle,
                        background: location.pathname === item.href 
                          ? (isSafari ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.2)')
                          : (isSafari ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)')
                      }}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <div className="mt-8 space-y-4">
                  <LanguageSwitcher />
                  <Button 
                    className="w-full bg-accent text-accent-foreground font-semibold"
                    size="sm"
                    style={safariGlassStyle}
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