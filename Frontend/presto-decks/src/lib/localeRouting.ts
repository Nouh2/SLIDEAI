export type AppLocale = "fr" | "en";

const EN_PREFIX = "/en";

export function normalizeLocale(locale?: string | null): AppLocale {
  return locale?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function stripLocalePrefix(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname === EN_PREFIX) {
    return "/";
  }

  if (pathname.startsWith(`${EN_PREFIX}/`)) {
    return pathname.slice(EN_PREFIX.length) || "/";
  }

  return pathname;
}

export function isLocalizedMarketingPath(pathname: string): boolean {
  const basePath = stripLocalePrefix(pathname);

  return (
    basePath === "/" ||
    basePath === "/pricing" ||
    basePath === "/examples" ||
    basePath === "/blog" ||
    basePath.startsWith("/blog/")
  );
}

export function getPathLocale(pathname: string): AppLocale | null {
  if (pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)) {
    return "en";
  }

  return isLocalizedMarketingPath(pathname) ? "fr" : null;
}

export function resolveLocale(pathname: string, currentLanguage?: string | null): AppLocale {
  return getPathLocale(pathname) ?? normalizeLocale(currentLanguage);
}

export function localizePath(pathname: string, locale: AppLocale): string {
  if (!pathname) {
    return locale === "en" ? EN_PREFIX : "/";
  }

  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const basePath = stripLocalePrefix(normalizedPath);

  if (!isLocalizedMarketingPath(basePath)) {
    return basePath;
  }

  if (locale === "en") {
    return basePath === "/" ? EN_PREFIX : `${EN_PREFIX}${basePath}`;
  }

  return basePath;
}

export function toAbsoluteUrl(pathname: string, locale: AppLocale, domain = "https://www.slideai.fr"): string {
  const localizedPath = localizePath(pathname, locale);
  return `${domain}${localizedPath}`;
}

export function getInitialLocale(pathname: string, storedLanguage?: string | null): AppLocale {
  const routeLocale = getPathLocale(pathname);
  if (routeLocale) {
    return routeLocale;
  }

  return normalizeLocale(storedLanguage);
}
