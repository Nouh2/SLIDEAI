import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, CreditCard } from 'lucide-react';

interface OutOfCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OutOfCreditsModal({ isOpen, onClose }: OutOfCreditsModalProps) {
    const navigate = useNavigate();

    const handleGoToPricing = () => {
        onClose();
        navigate('/pricing');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-7 w-7 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">Plus de crédits disponibles</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Vous avez utilisé tous vos crédits de génération.
                        Achetez un pack ou passez à un abonnement pour continuer à créer des présentations.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">Packs Liberté</p>
                            <p className="text-xs text-muted-foreground">
                                Achetez des crédits à l'unité, sans engagement. À partir de 5€.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <CreditCard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">Abonnements</p>
                            <p className="text-xs text-muted-foreground">
                                Jusqu'à un nombre illimité de présentations par mois. À partir de 7€/mois.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        variant="solid"
                        className="w-full font-bold shadow-lg shadow-primary/20"
                        onClick={handleGoToPricing}
                    >
                        Voir les options
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={onClose}
                    >
                        Plus tard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
