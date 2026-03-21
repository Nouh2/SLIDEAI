import { useState, useEffect } from "react";
import { X, Share2, FileDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = (userId: string) => `slideai-feature-discovery-dismissed-${userId}`;

interface FeatureDiscoveryCardProps {
    userId: string;
    isPayingUser: boolean;
}

export function FeatureDiscoveryCard({ userId, isPayingUser }: FeatureDiscoveryCardProps) {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!userId || !isPayingUser) return;
        const dismissed = localStorage.getItem(STORAGE_KEY(userId));
        if (!dismissed) setVisible(true);
    }, [userId, isPackUser]);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY(userId), "1");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="relative rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/40 p-4 animate-fade-in-up">
            <button
                onClick={dismiss}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer"
            >
                <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                ✨ Fonctionnalités incluses dans votre pack
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Partagez avec vos clients</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Envoyez un lien de lecture seule — aucun compte requis pour le destinataire.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <FileDown className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Export PowerPoint éditable</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Téléchargez en .pptx modifiable pour retoucher dans PowerPoint ou Google Slides.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Sans filigrane</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Vos exports et liens partagés sont propres, sans logo SlideAI.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
                <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                    onClick={() => { navigate("/dashboard"); dismiss(); }}
                >
                    Ouvrir une présentation
                </Button>
                <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Ne plus afficher
                </button>
            </div>
        </div>
    );
}
