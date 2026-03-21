import { useState, useEffect } from "react";
import { X, Share2, FileDown, Sparkles, Users, Palette, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = (userId: string) => `slideai-feature-discovery-dismissed-${userId}`;

interface FeatureDiscoveryCardProps {
    userId: string;
    isPayingUser: boolean;
    isPack: boolean;
}

const PACK_CONTENT = {
    badge: "✨ Fonctionnalités incluses dans votre pack",
    accent: {
        border: "border-amber-200/60",
        bg: "from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20",
        darkBorder: "dark:border-amber-800/40",
        icon: "bg-amber-100 dark:bg-amber-900/50",
        iconColor: "text-amber-700 dark:text-amber-400",
        badgeText: "text-amber-700 dark:text-amber-400",
        btn: "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300",
    },
    features: [
        {
            icon: Share2,
            title: "Partagez avec vos clients",
            desc: "Envoyez un lien de lecture seule — aucun compte requis pour le destinataire.",
        },
        {
            icon: FileDown,
            title: "Export PowerPoint éditable",
            desc: "Téléchargez en .pptx modifiable pour retoucher dans PowerPoint ou Google Slides.",
        },
        {
            icon: Sparkles,
            title: "Sans filigrane",
            desc: "Vos exports et liens partagés sont propres, sans logo SlideAI.",
        },
    ],
    cta: "Ouvrir une présentation",
};

const PRO_CONTENT = {
    badge: "🚀 Tout ce que vous avez avec Pro",
    accent: {
        border: "border-primary/20",
        bg: "from-primary/5 to-violet-500/5 dark:from-primary/10 dark:to-violet-500/10",
        darkBorder: "dark:border-primary/30",
        icon: "bg-primary/10 dark:bg-primary/20",
        iconColor: "text-primary",
        badgeText: "text-primary",
        btn: "border-primary/30 text-primary hover:bg-primary/10",
    },
    features: [
        {
            icon: Share2,
            title: "Partage collaboratif",
            desc: "Invitez des collègues à éditer en temps réel avec un lien d'édition partagé.",
        },
        {
            icon: Palette,
            title: "Brand Kit",
            desc: "Enregistrez vos couleurs, polices et logos pour des présentations toujours cohérentes.",
        },
        {
            icon: Users,
            title: "Créez votre équipe",
            desc: "Invitez vos collaborateurs dans un espace partagé pour travailler ensemble.",
        },
        {
            icon: RefreshCw,
            title: "Crédits mensuels renouvelés",
            desc: "Vos crédits IA se renouvellent chaque mois — générez autant que vous voulez.",
        },
    ],
    cta: "Créer une présentation",
};

export function FeatureDiscoveryCard({ userId, isPayingUser, isPack }: FeatureDiscoveryCardProps) {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!userId || !isPayingUser) return;
        const dismissed = localStorage.getItem(STORAGE_KEY(userId));
        if (!dismissed) setVisible(true);
    }, [userId, isPayingUser]);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY(userId), "1");
        setVisible(false);
    };

    if (!visible) return null;

    const content = isPack ? PACK_CONTENT : PRO_CONTENT;
    const { accent } = content;

    return (
        <div className={`relative rounded-xl border ${accent.border} ${accent.darkBorder} bg-gradient-to-r ${accent.bg} p-4 animate-fade-in-up`}>
            <button
                onClick={dismiss}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer"
            >
                <X className="h-4 w-4" />
            </button>

            <p className={`text-xs font-semibold uppercase tracking-wider ${accent.badgeText} mb-3`}>
                {content.badge}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {content.features.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 flex-1 min-w-[180px]">
                        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${accent.icon} flex items-center justify-center`}>
                            <Icon className={`h-4 w-4 ${accent.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
                <Button
                    size="sm"
                    variant="outline"
                    className={accent.btn}
                    onClick={() => { navigate("/dashboard"); dismiss(); }}
                >
                    {content.cta}
                </Button>
                <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Ne plus afficher
                </button>
            </div>
        </div>
    );
}
