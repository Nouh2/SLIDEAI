import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { Analytics } from '@/lib/analytics';

interface OutOfCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OutOfCreditsModal({ isOpen, onClose }: OutOfCreditsModalProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        if (!isOpen) return;
        Analytics.trackPaywallViewed({
            surface: 'out_of_credits_modal',
            reason: 'generation_limit',
            feature: 'ai_generation',
        });
    }, [isOpen]);

    const handleStartPro = () => {
        Analytics.trackPaywallCtaClicked({
            surface: 'out_of_credits_modal',
            reason: 'generation_limit',
            feature: 'ai_generation',
            plan: 'pro_intro',
        });
        onClose();
        navigate('/pricing?checkout=pro_intro');
    };

    const handleViewPacks = () => {
        Analytics.trackPaywallCtaClicked({
            surface: 'out_of_credits_modal',
            reason: 'generation_limit',
            feature: 'ai_generation',
            plan: 'pack',
        });
        onClose();
        navigate('/pricing');
    };

    const handleDismiss = () => {
        Analytics.trackPaywallDismissed({
            surface: 'out_of_credits_modal',
            reason: 'generation_limit',
            feature: 'ai_generation',
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-7 w-7 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">{t('outOfCredits.title')}</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {t('outOfCredits.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <CreditCard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">{t('outOfCredits.subscriptions.title')}</p>
                            <p className="text-xs text-muted-foreground">
                                {t('outOfCredits.subscriptions.desc')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">{t('outOfCredits.packs.title')}</p>
                            <p className="text-xs text-muted-foreground">
                                {t('outOfCredits.packs.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        variant="solid"
                        className="w-full font-bold shadow-lg shadow-primary/20"
                        onClick={handleStartPro}
                    >
                        {t('outOfCredits.startPro')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full font-semibold"
                        onClick={handleViewPacks}
                    >
                        {t('outOfCredits.seePacks')}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={handleDismiss}
                    >
                        {t('outOfCredits.later')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
