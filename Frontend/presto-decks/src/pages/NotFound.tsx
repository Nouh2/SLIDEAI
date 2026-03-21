import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";
import { useLocalePath } from "@/hooks/use-locale-path";

const NotFound = () => {
  const { t } = useTranslation();
  const { localize } = useLocalePath();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mb-4">
          <AlertCircle className="h-12 w-12 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            {t('notFound.title')}
          </h1>
          <p className="text-2xl font-semibold text-[var(--text)]">
            {t('notFound.message')}
          </p>
          <p className="text-[var(--muted)] max-w-md mx-auto">
            {t('notFound.description')}
          </p>
        </div>

        <Button size="lg" variant="solid" asChild>
          <Link to={localize("/")}>
            <Home className="mr-2 h-5 w-5" />
            {t('notFound.backHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
