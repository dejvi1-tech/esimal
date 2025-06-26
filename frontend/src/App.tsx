import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import NotFound from './pages/NotFound';
import CountryPage from './pages/CountryPage';
import SearchPage from './pages/SearchPage';
import BundlePage from './pages/BundlePage';
import CheckBalancePage from './pages/CheckBalancePage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <HelmetProvider>
        <LanguageProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/country/:code" element={<CountryPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/bundle/:bundleId" element={<BundlePage />} />
                <Route path="/balance" element={<CheckBalancePage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
                <Route path="/checkout/*" element={<CheckoutPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </LanguageProvider>
      </HelmetProvider>
    </>
  );
}

export default App;