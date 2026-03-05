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
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] sm:w-[380px] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-[1.25rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5">
                    {!showPreferences ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                                    <Cookie className="h-4 w-4 text-primary" />
                                </div>
                                <div className="space-y-1.5 mt-0.5">
                                    <h3 className="font-semibold text-sm leading-none tracking-tight">{t('cookie.title')}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {t('cookie.text')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => savePreferences(true)} className="flex-1 rounded-xl text-xs h-9 font-medium shadow-sm">
                                        {t('cookie.accept')}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => savePreferences(false, true)} className="flex-1 rounded-xl text-xs h-9 font-medium">
                                        {t('cookie.refuse')}
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowPreferences(true)} className="w-full rounded-xl text-xs h-8 text-muted-foreground hover:text-foreground">
                                    {t('cookie.manage')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <button onClick={() => setShowPreferences(false)} className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors">
                                    <ChevronRight className="h-4 w-4 rotate-180 text-muted-foreground" />
                                </button>
                                <h3 className="font-semibold text-sm">{t('cookie.manage')}</h3>
                            </div>

                            <div className="space-y-2">
                                {/* Necessary (Locked) */}
                                <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                            <span className="text-sm font-medium">{t('cookie.necessary')}</span>
                                        </div>
                                        <Switch checked disabled className="scale-75 origin-right" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed px-1">{t('cookie.necessaryDesc')}</p>
                                </div>

                                {/* Analytics */}
                                <div className="flex flex-col gap-2 p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            </div>
                                            <span className="text-sm font-medium">{t('cookie.analytics')}</span>
                                        </div>
                                        <Switch
                                            checked={analyticsEnabled}
                                            onCheckedChange={setAnalyticsEnabled}
                                            className="scale-75 origin-right data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed px-1">{t('cookie.analyticsDesc')}</p>
                                </div>
                            </div>

                            <Button size="sm" onClick={() => savePreferences()} className="w-full rounded-xl text-xs h-9 font-medium shadow-sm mt-2">
                                {t('cookie.save')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
