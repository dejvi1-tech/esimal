import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { getCountryNameByCode, countrySlug } from './lib/utils';

// Lazy load all page components
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CountryPage = lazy(() => import('./pages/CountryPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CheckBalancePage = lazy(() => import('./pages/CheckBalancePage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const CheckoutCancelPage = lazy(() => import('./pages/CheckoutCancelPage'));
const IOS26Demo = lazy(() => import('./components/IOS26Demo'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

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
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Checkout routes without Layout */}
                <Route path="/checkout/*" element={<CheckoutPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

                {/* Main country route - top-level */}
                <Route
                  path="/country/:slug"
                  element={
                    <>
                      {console.log('CountryPage mounted')}
                      <CountryPage />
                    </>
                  }
                />

                {/* All other routes with Layout */}
                <Route path="/*" element={
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="" element={<HomePage />} />
                        <Route path="about" element={<AboutUsPage />} />
                        <Route path="packages" element={<PackagesPage />} />
                        <Route path="how-it-works" element={<HowItWorksPage />} />
                        <Route path="reviews" element={<ReviewsPage />} />
                        <Route path="support" element={<SupportPage />} />
                        <Route path="admin/login" element={<AdminLoginPage />} />
                        <Route path="admin" element={
                          <ProtectedAdminRoute>
                            <AdminPanel />
                          </ProtectedAdminRoute>
                        } />
                        {/* Legacy redirects */}
                        <Route path="bundle/:slug" element={<Navigate to={({ params }) => `/country/${params.slug}`} replace />} />
                        <Route path="search" element={<SearchPage />} />
                        <Route path="balance" element={<CheckBalancePage />} />
                        <Route path="ios26-demo" element={<IOS26Demo />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                } />
              </Routes>
            </Suspense>
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
  const { slug } = useParams();
  const name = slug ? getCountryNameByCode(slug) : undefined;
  if (!name) {
    return <Navigate to="/not-found" replace />;
  }
  return <Navigate to={`/country/${countrySlug(name)}`} replace />;
}

export default App;