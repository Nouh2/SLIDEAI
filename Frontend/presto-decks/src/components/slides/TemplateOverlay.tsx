// src/components/slides/TemplateOverlay.tsx
// Renders logo and footer overlay on top of slides based on brand kit settings
import React from 'react';
import { TemplateOverlay as TemplateOverlayConfig } from '@/lib/api';

interface TemplateOverlayProps {
    config?: TemplateOverlayConfig;
    logoUrl?: string;
    slideNumber?: number;
    totalSlides?: number;
    isFirst?: boolean; // Is cover slide
    children: React.ReactNode;
}

// Size mapping for logo
const LOGO_SIZES = {
    small: { width: 80, height: 40 },
    medium: { width: 120, height: 60 },
    large: { width: 160, height: 80 },
};

// Position mapping for logo
const LOGO_POSITIONS = {
    'top-left': 'top-6 left-8',
    'top-right': 'top-6 right-8',
    'bottom-left': 'bottom-20 left-8',
    'bottom-right': 'bottom-20 right-8',
};

export function TemplateOverlay({
    config,
    logoUrl,
    slideNumber,
    totalSlides,
    isFirst = false,
    children
}: TemplateOverlayProps) {
    // If no config or logo URL, just render children
    if (!config || (!logoUrl && !config.footer?.text)) {
        return <>{children}</>;
    }

    const logoSettings = config.logo;
    const footerSettings = config.footer;

    // Determine if logo should show
    const showLogo = logoUrl && logoSettings &&
        (isFirst ? logoSettings.showOnCover : logoSettings.showOnContent);

    const logoSize = LOGO_SIZES[logoSettings?.size || 'medium'];
    const logoPosition = LOGO_POSITIONS[logoSettings?.position || 'top-left'];

    // Determine if footer should show
    const hasFooterContent = footerSettings?.text || footerSettings?.showPageNumber;

    return (
        <div className="relative w-full h-full">
            {/* Original slide content */}
            {children}

            {/* Logo Overlay */}
            {showLogo && (
                <div className={`absolute ${logoPosition} z-50 pointer-events-none`}>
                    <img
                        src={logoUrl}
                        alt="Company Logo"
                        style={{
                            maxWidth: logoSize.width,
                            maxHeight: logoSize.height,
                            objectFit: 'contain',
                        }}
                        className="drop-shadow-md"
                    />
                </div>
            )}

            {/* Footer Overlay */}
            {hasFooterContent && (
                <div className="absolute bottom-0 left-0 right-0 h-16 px-8 flex items-center justify-between z-40 pointer-events-none">
                    {/* Footer text (left) */}
                    <span className="text-xs opacity-60 text-current">
                        {footerSettings?.text || ''}
                    </span>

                    {/* Page number (right) */}
                    {footerSettings?.showPageNumber && slideNumber && (
                        <span className="text-xs opacity-50 font-medium text-current">
                            {slideNumber}{totalSlides ? ` / ${totalSlides}` : ''}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
