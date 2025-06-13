import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, User, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { name: t('packages'), href: '/packages' },
    { name: t('how_it_works'), href: '/how-it-works' },
    { name: t('about_us'), href: '/about' },
    { name: t('support'), href: '/support' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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
            <img
              src="/logo.png"
              alt="e-SimFly Logo"
              className="h-14 w-14 object-contain drop-shadow-md transition-transform group-hover:scale-105"
              style={{ minWidth: 56 }}
            />
            <span className="text-2xl font-extrabold tracking-tight text-[#7B2FF2]" style={{ letterSpacing: '0.01em' }}>
              e-<span className="font-black">SimFly</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 ${
                  location.pathname === item.href ? 'text-blue-600' : ''
                }`}>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="rounded-full p-0 w-10 h-10 flex items-center justify-center border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                    aria-label="Profile"
                  >
                    <User className="w-6 h-6 text-blue-600" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 font-semibold border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50">
                      {user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/profile" className="cursor-pointer">
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="font-semibold border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 rounded-full">
                    Sign Up
              </Button>
            </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
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
                  <span className="text-2xl font-extrabold tracking-tight text-[#7B2FF2]" style={{ letterSpacing: '0.01em' }}>
                    e-<span className="font-black">SimFly</span>
                  </span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <nav className="space-y-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block w-full text-left text-lg font-medium text-gray-700 hover:text-blue-600 py-3 border-b border-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}>
                    {item.name}
                  </Link>
                ))}
              </nav>
              
              <div className="mt-8 space-y-4">
                <LanguageSwitcher />
                {user && (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className="rounded-full p-0 w-10 h-10 flex items-center justify-center border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 mb-2"
                      aria-label="Profile"
                    >
                      <User className="w-6 h-6 text-blue-600" />
                    </Button>
                  </Link>
                )}
                {user ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start font-semibold text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full justify-start font-semibold">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                        Sign Up
                  </Button>
                </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;