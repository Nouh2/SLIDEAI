import { Helmet } from "react-helmet-async";

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export function SEO({
    title,
    description = "Generate, edit, and share professional PowerPoint presentations with AI.",
    image = "/og-image.png",
    url = "https://www.slideai.fr/",
    type = "website"
}: SEOProps) {

    const siteTitle = "SlideAI";
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

    // Ensure absolute URLs for OG images
    const fullImage = image.startsWith("http") ? image : `https://www.slideai.fr${image.startsWith("/") ? "" : "/"}${image}`;
    const fullUrl = url.startsWith("http") ? url : `https://www.slideai.fr${url.startsWith("/") ? "" : "/"}${url}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
}
