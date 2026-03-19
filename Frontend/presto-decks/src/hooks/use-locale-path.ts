import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLocale, localizePath, resolveLocale } from "@/lib/localeRouting";

export function useLocalePath() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const locale = resolveLocale(location.pathname, i18n.language);

  return {
    locale,
    localize: (pathname: string, forcedLocale?: AppLocale) => localizePath(pathname, forcedLocale ?? locale),
  };
}
