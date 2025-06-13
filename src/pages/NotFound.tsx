import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-id="05xwgg0hz" data-path="src/pages/NotFound.tsx">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 p-8" data-id="64ajvzvq2" data-path="src/pages/NotFound.tsx">

        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }} data-id="dg37aqe2j" data-path="src/pages/NotFound.tsx">

          <h1 className="text-8xl font-bold text-primary" data-id="fmromx5yx" data-path="src/pages/NotFound.tsx">404</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4" data-id="gau11m0co" data-path="src/pages/NotFound.tsx">

          <h2 className="text-2xl font-semibold tracking-tight" data-id="fywg8gpw2" data-path="src/pages/NotFound.tsx">{t('not_found_title')}</h2>
          <p className="text-muted-foreground" data-id="23yjn50zq" data-path="src/pages/NotFound.tsx">
            {t('not_found_description')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }} data-id="h5sbu8wtq" data-path="src/pages/NotFound.tsx">

          <Button asChild variant="default" size="lg" data-id="h6ofcnzzj" data-path="src/pages/NotFound.tsx">
            <a href="/" data-id="257721va1" data-path="src/pages/NotFound.tsx">{t('back_to_home')}</a>
          </Button>
        </motion.div>
      </motion.div>
    </div>);

};

export default NotFound;