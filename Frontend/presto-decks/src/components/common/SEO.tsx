import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { localizePath, resolveLocale, stripLocalePrefix, toAbsoluteUrl, type AppLocale } from "@/lib/localeRouting";

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    keywords?: string;
    alternates?: Partial<Record<AppLocale | "x-default", string>>;
}

export function SEO({
    title,
    description = "Generate, edit, and share professional PowerPoint presentations with AI.",
    image = "/og-image.png",
    url = "https://www.slideai.fr/",
    type = "website",
    keywords,
    alternates,
}: SEOProps) {
    const location = useLocation();
    const { i18n } = useTranslation();

    const siteTitle = "SlideAI";
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
    const currentLocale = resolveLocale(location.pathname, i18n.language);
    const basePath = /^https?:\/\//i.test(url) ? new URL(url).pathname : stripLocalePrefix(url);
    const localizedPath = /^https?:\/\//i.test(url) ? new URL(url).pathname : localizePath(basePath, currentLocale);

    // Ensure absolute URLs for OG images
    const fullImage = image.startsWith("http") ? image : `https://www.slideai.fr${image.startsWith("/") ? "" : "/"}${image}`;
    const fullUrl = url.startsWith("http") ? url : toAbsoluteUrl(localizedPath, currentLocale);

    return (
        <Helmet>
            <html lang={currentLocale} />
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />

            {/* Canonical URL */}
            <link rel="canonical" href={fullUrl} />
            {alternates?.fr && <link rel="alternate" hrefLang="fr" href={toAbsoluteUrl(alternates.fr, "fr")} />}
            {alternates?.en && <link rel="alternate" hrefLang="en" href={toAbsoluteUrl(alternates.en, "en")} />}
            {alternates?.["x-default"] && (
                <link rel="alternate" hrefLang="x-default" href={toAbsoluteUrl(alternates["x-default"], "fr")} />
            )}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
}
