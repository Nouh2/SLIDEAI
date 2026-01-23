// components/editor/FontSelectorDialog.tsx
// Modal for customizing presentation fonts

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Type, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Available Google Fonts
const AVAILABLE_FONTS = [
    { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", category: 'sans-serif' },
    { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans-serif' },
    { id: 'open-sans', name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'sans-serif' },
    { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans-serif' },
    { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans-serif' },
    { id: 'lato', name: 'Lato', family: "'Lato', sans-serif", category: 'sans-serif' },
    { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif' },
    { id: 'merriweather', name: 'Merriweather', family: "'Merriweather', serif", category: 'serif' },
    { id: 'arial', name: 'Arial', family: 'Arial, sans-serif', category: 'sans-serif' },
    { id: 'georgia', name: 'Georgia', family: 'Georgia, serif', category: 'serif' },
];

export interface FontConfig {
    heading: string;
    body: string;
}

interface FontSelectorDialogProps {
    currentFontConfig?: FontConfig;
    onApply: (fontConfig: FontConfig) => void;
    children: React.ReactNode;
}

export function FontSelectorDialog({
    currentFontConfig,
    onApply,
    children,
}: FontSelectorDialogProps) {
    const [open, setOpen] = useState(false);
    const [headingFont, setHeadingFont] = useState(currentFontConfig?.heading || 'inter');
    const [bodyFont, setBodyFont] = useState(currentFontConfig?.body || 'inter');

    const { toast } = useToast();
    const { t } = useTranslation();

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            setHeadingFont(currentFontConfig?.heading || 'inter');
            setBodyFont(currentFontConfig?.body || 'inter');
        }
    }, [open, currentFontConfig]);

    const handleApply = () => {
        onApply({
            heading: headingFont,
            body: bodyFont,
        });

        toast({
            title: t('fontSelector.success'),
            description: t('fontSelector.successMsg'),
        });

        setOpen(false);
    };

    const getFontFamily = (fontId: string) => {
        return AVAILABLE_FONTS.find(f => f.id === fontId)?.family || 'Arial, sans-serif';
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-primary" />
                        {t('fontSelector.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('fontSelector.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Heading Font */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">{t('fontSelector.headingFont')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_FONTS.map((font) => (
                                <button
                                    key={font.id}
                                    type="button"
                                    onClick={() => setHeadingFont(font.id)}
                                    className={`relative flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left ${headingFont === font.id
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <span
                                        className="text-sm font-medium"
                                        style={{ fontFamily: font.family }}
                                    >
                                        {font.name}
                                    </span>
                                    {headingFont === font.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body Font */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">{t('fontSelector.bodyFont')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_FONTS.map((font) => (
                                <button
                                    key={font.id}
                                    type="button"
                                    onClick={() => setBodyFont(font.id)}
                                    className={`relative flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left ${bodyFont === font.id
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <span
                                        className="text-sm"
                                        style={{ fontFamily: font.family }}
                                    >
                                        {font.name}
                                    </span>
                                    {bodyFont === font.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('fontSelector.preview')}</p>
                        <h3
                            className="text-xl font-bold"
                            style={{ fontFamily: getFontFamily(headingFont) }}
                        >
                            {t('fontSelector.previewHeading')}
                        </h3>
                        <p
                            className="text-sm text-muted-foreground"
                            style={{ fontFamily: getFontFamily(bodyFont) }}
                        >
                            {t('fontSelector.previewBody')}
                        </p>
                    </div>
                </div>

                <DialogFooter>

                    <Button onClick={handleApply}>
                        <Type className="mr-2 h-4 w-4" />
                        {t('fontSelector.apply')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Export font list for use elsewhere
export { AVAILABLE_FONTS };
