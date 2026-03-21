import { useState, useEffect } from "react";
import { X, Share2, FileDown, Sparkles, Users, Palette, RefreshCw, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = (userId: string) => `slideai-feature-discovery-dismissed-${userId}`;

export type PlanType = "pack" | "pro" | "business";

interface FeatureDiscoveryCardProps {
    userId: string;
    planType: PlanType | null;
}

const CONTENT = {
    pack: {
        badge: "✨ Fonctionnalités incluses dans votre pack",
        border: "border-amber-200/60 dark:border-amber-800/40",
        bg: "from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20",
        iconBg: "bg-amber-100 dark:bg-amber-900/50",
        iconColor: "text-amber-700 dark:text-amber-400",
        textColor: "text-amber-700 dark:text-amber-400",
        btn: "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300",
        features: [
            { icon: Share2, title: "Partagez avec vos clients", desc: "Envoyez un lien de lecture seule — aucun compte requis pour le destinataire." },
            { icon: FileDown, title: "Export PowerPoint éditable", desc: "Téléchargez en .pptx modifiable pour retoucher dans PowerPoint ou Google Slides." },
            { icon: Sparkles, title: "Sans filigrane", desc: "Vos exports et liens partagés sont propres, sans logo SlideAI." },
        ],
        cta: "Ouvrir une présentation",
    },
    pro: {
        badge: "🚀 Tout ce que vous avez avec Pro",
        border: "border-primary/20 dark:border-primary/30",
        bg: "from-primary/5 to-violet-500/5 dark:from-primary/10 dark:to-violet-500/10",
        iconBg: "bg-primary/10 dark:bg-primary/20",
        iconColor: "text-primary",
        textColor: "text-primary",
        btn: "border-primary/30 text-primary hover:bg-primary/10",
        features: [
            { icon: Share2, title: "Partage collaboratif", desc: "Invitez des collègues à éditer en temps réel avec un lien d'édition partagé." },
            { icon: Palette, title: "Brand Kit", desc: "Enregistrez vos couleurs, polices et logos pour des présentations toujours cohérentes." },
            { icon: RefreshCw, title: "Crédits mensuels renouvelés", desc: "Vos crédits IA se renouvellent chaque mois — générez autant que vous voulez." },
        ],
        cta: "Créer une présentation",
    },
    business: {
        badge: "💼 Tout ce que vous avez avec Business",
        border: "border-indigo-200/60 dark:border-indigo-700/40",
        bg: "from-indigo-50/80 to-blue-50/60 dark:from-indigo-950/30 dark:to-blue-950/20",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
        iconColor: "text-indigo-700 dark:text-indigo-400",
        textColor: "text-indigo-700 dark:text-indigo-400",
        btn: "border-indigo-300 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300",
        features: [
            { icon: Users, title: "Espace équipe", desc: "Invitez vos collaborateurs dans un workspace partagé pour travailler ensemble." },
            { icon: Share2, title: "Partage collaboratif", desc: "Plusieurs membres de l'équipe peuvent éditer les mêmes présentations en temps réel." },
            { icon: Palette, title: "Brand Kit partagé", desc: "Toute l'équipe utilise la même charte graphique — cohérence garantie sur chaque deck." },
            { icon: Headphones, title: "Support prioritaire", desc: "Une question ? Vous passez en tête de file pour une réponse rapide." },
        ],
        cta: "Configurer mon équipe",
    },
};

export function FeatureDiscoveryCard({ userId, planType }: FeatureDiscoveryCardProps) {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!userId || !planType) return;
        const dismissed = localStorage.getItem(STORAGE_KEY(userId));
        if (!dismissed) setVisible(true);
    }, [userId, planType]);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY(userId), "1");
        setVisible(false);
    };

    if (!visible || !planType) return null;

    const c = CONTENT[planType];
    const ctaTarget = planType === "business" ? `/org/settings` : "/dashboard";

    return (
        <div className={`relative rounded-xl border ${c.border} bg-gradient-to-r ${c.bg} p-4 animate-fade-in-up`}>
            <button onClick={dismiss} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors" aria-label="Fermer">
                <X className="h-4 w-4" />
            </button>

            <p className={`text-xs font-semibold uppercase tracking-wider ${c.textColor} mb-3`}>
                {c.badge}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {c.features.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 flex-1 min-w-[180px]">
                        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                            <Icon className={`h-4 w-4 ${c.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
                <Button size="sm" variant="outline" className={c.btn} onClick={() => { navigate(ctaTarget); dismiss(); }}>
                    {c.cta}
                </Button>
                <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Ne plus afficher
                </button>
            </div>
        </div>
    );
}
