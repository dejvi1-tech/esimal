import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {t('not_found_title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {t('not_found_description')}
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              {t('not_found_go_home')}
            </Button>
          </Link>
          <div className="text-sm text-gray-500">
            {t('not_found_help_text')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;