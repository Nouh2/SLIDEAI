import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Cookie, ShieldCheck, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const CookieConsent = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

    // Preferences state
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

    useEffect(() => {
        // Check if user has already accepted or refused cookies
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const savePreferences = (all = false, none = false) => {
        let consentValue;

        if (all) {
            consentValue = "all";
            setAnalyticsEnabled(true);
        } else if (none) {
            consentValue = "necessary";
            setAnalyticsEnabled(false);
        } else {
            consentValue = JSON.stringify({ necessary: true, analytics: analyticsEnabled });
        }

        localStorage.setItem("cookie-consent", consentValue);
        window.dispatchEvent(new Event("cookie-consent-updated"));
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-4 flex items-start justify-between gap-3 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Cookie className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">{t('cookie.title')}</h3>
                    </div>
                    <button
                        onClick={() => savePreferences(false, true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {!showPreferences ? (
                        <>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t('cookie.text')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                                <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
                                    {t('cookie.manage')}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => savePreferences(false, true)}>
                                    {t('cookie.refuse')}
                                </Button>
                                <Button size="sm" onClick={() => savePreferences(true)}>
                                    {t('cookie.accept')}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {/* Necessary (Locked) */}
                                <div className="flex items-start justify-between gap-4 p-3 rounded-md bg-muted/30 border border-border/50">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-sm font-medium">{t('cookie.necessary')}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{t('cookie.necessaryDesc')}</span>
                                    </div>
                                    <Switch checked disabled />
                                </div>

                                {/* Analytics */}
                                <div className="flex items-start justify-between gap-4 p-3 rounded-md bg-card border border-border/50">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">{t('cookie.analytics')}</span>
                                        <span className="text-xs text-muted-foreground">{t('cookie.analyticsDesc')}</span>
                                    </div>
                                    <Switch
                                        checked={analyticsEnabled}
                                        onCheckedChange={setAnalyticsEnabled}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2 border-t border-border/50 mt-4">
                                <Button variant="ghost" size="sm" onClick={() => setShowPreferences(false)}>
                                    {t('common.back')}
                                </Button>
                                <Button size="sm" onClick={() => savePreferences()}>
                                    {t('cookie.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
