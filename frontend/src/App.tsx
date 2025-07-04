import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutUsPage from './pages/AboutUsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PackagesPage from './pages/PackagesPage';
import ReviewsPage from './pages/ReviewsPage';
import SupportPage from './pages/SupportPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPanel from './pages/AdminPanel';
import AdminLoginPage from './pages/AdminLoginPage';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import NotFound from './pages/NotFound';
import CountryPage from './pages/CountryPage';
import SearchPage from './pages/SearchPage';
import CheckBalancePage from './pages/CheckBalancePage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import IOS26Demo from './components/IOS26Demo';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { getCountryNameByCode, countrySlug } from './lib/utils';

// Helper for legacy /country/:code redirect
function generateFullCountryPath(code: string | undefined): string {
  if (!code) return 'not-found';
  const name = getCountryNameByCode(code);
  return name ? countrySlug(name) : code;
}

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <HelmetProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              {/* Checkout routes without Layout */}
              <Route path="/checkout/*" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
              
              {/* All other routes with Layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutUsPage />} />
                    <Route path="/packages" element={<PackagesPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/reviews" element={<ReviewsPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin" element={
                      <ProtectedAdminRoute>
                        <AdminPanel />
                      </ProtectedAdminRoute>
                    } />
                    {/* Legacy redirects */}
                    <Route path="/bundle/:country" element={<Navigate to={({ params }) => `/country/${params.country}`} replace />} />
                    <Route path="/country/:code" element={<Navigate to={({ params }) => `/country/${generateFullCountryPath(params.code)}`} replace />} />
                    {/* Main country route above catch-all */}
                    <Route path="/country/:slug" element={<CountryPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/balance" element={<CheckBalancePage />} />
                    <Route path="/ios26-demo" element={<IOS26Demo />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Router>
        </LanguageProvider>
      </HelmetProvider>
    </>
  );
}

/**
 * Redirects /country/:code to /country/:full-country-name (slugified).
 * If code is not found, redirects to /not-found.
 */
function LegacyCountryRedirect() {
  const { code } = useParams();
  const name = code ? getCountryNameByCode(code) : undefined;
  if (!name) {
    return <Navigate to="/not-found" replace />;
  }
  return <Navigate to={`/country/${countrySlug(name)}`} replace />;
}

export default App;