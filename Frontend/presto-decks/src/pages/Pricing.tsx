import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Zap, Layers, HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  // Mapping plans to Stripe Price IDs (REPLACE WITH YOUR TEST PRICE IDs)
  const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
    Starter: {
      monthly: "price_1Sn5Iw5KgGKgF82ebXEDerSL",
      yearly: "price_1Sn5Jx5KgGKgF82e7TVoKqcJ",
    },
    Pro: {
      monthly: "price_1Sn5IN5KgGKgF82elQlvSUIf",
      yearly: "price_1Sn5Jd5KgGKgF82erWwaHW8G",
    },
    Business: {
      monthly: "price_1Sn5JB5KgGKgF82egl8duDWF",
      yearly: "price_1Sn5KK5KgGKgF82eSgoyWSnS",
    },
  };

  const handleSubscribe = async (planName: string) => {
    if (planName === "Free") {
      navigate("/app");
      return;
    }

    if (planName === "Business") {
      window.location.href = "mailto:contact@slideai.com";
      return;
    }

    setLoadingPlan(planName);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Veuillez vous connecter pour souscrire");
        navigate("/join");
        return;
      }

      const priceId = STRIPE_PRICE_IDS[planName][billingCycle];

      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          plan: planName.toLowerCase()
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Erreur lors de la création de la session de paiement");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "0€",
      period: "/mois",
      description: "Suffisant pour tester l'outil",
      features: [
        "2 présentations par mois",
        "Import PDF (10 pages max)",
        "Stockage : 3 projets max",
        "Ajout de slides IA (2 / prés.)",
        "Régénération IA (3 / prés.)",
        "Layouts & Design : Accès Total",
        "Filigrane SlideAI",
      ],
      limitations: [
        "Export PDF Désactivé",
        "Pas de Brand Kit",
      ],
      cta: "Commencer gratuitement",
      variant: "outline" as const,
      popular: false,
      badge: null,
    },
    {
      name: "Starter",
      price: billingCycle === "yearly" ? "7€" : "9€",
      period: "/mois",
      billingNote: billingCycle === "yearly" ? "Facturé 84€ par an" : "Facturé mensuellement",
      description: "Pour étudiants et usage occasionnel",
      features: [
        "15 présentations / mois",
        "Import PDF (50 pages max)",
        "Stockage : 20 projets max",
        "Ajout de slides IA (5 / prés.)",
        "Régénération IA Illimitée",
        "Export PDF HD (Sans filigrane)",
        "Lien de partage Unique & Privé",
      ],
      limitations: [],
      cta: "Choisir Starter",
      variant: "outline" as const,
      popular: false,
      badge: null,
    },
    {
      name: "Pro",
      price: billingCycle === "yearly" ? "14€" : "19€",
      period: "/mois",
      billingNote: billingCycle === "yearly" ? "Facturé 168€ par an" : "Facturé mensuellement",
      description: "Pour les professionnels",
      features: [
        <span key="unlimited" className="font-bold">Génération Illimitée</span>,
        "Import PDF (200 pages max)",
        "Stockage Illimité",
        "Ajout de slides & Wand Illimités",
        "Export PDF HD (Prioritaire)",
        "Support Prioritaire",
        <span key="beta-export" className="flex items-center gap-2">
          Accès Early Bird (Bêta)
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Bêta</span>
        </span>,
      ],
      cta: "Essayer Pro gratuitement",
      variant: "solid" as const,
      popular: true,
      badge: "Plus populaire",
    },
    {
      name: "Business",
      price: billingCycle === "yearly" ? "49€" : "59€",
      period: "/mois",
      billingNote: billingCycle === "yearly" ? "Facturé 588€ par an" : "Facturé mensuellement",
      description: "Pour les équipes",
      features: [
        "Tout du Plan Pro",
        "Espace de travail collaboratif",
        "Support Prioritaire 24/7",
        "Analytics avancées",
        "SSO (Single Sign-On)",
      ],
      cta: "Contacter les ventes",
      variant: "solid" as const,
      popular: false,
      badge: null,
    },
  ];

  const packs = [
    {
      name: "Pack Découverte",
      price: "7€",
      credits: "5 présentations",
      icon: Layers,
      cta: "Acheter 5 crédits",
    },
    {
      name: "Pack Power",
      price: "15€",
      credits: "15 présentations",
      icon: Layers,
      cta: "Acheter 15 crédits",
    },
  ];

  return (
    <div className="py-12 md:py-20">
      <section className="container px-4 md:px-6">
        <div className="text-center space-y-6 mb-12 md:mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 rounded-full glass px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm mb-4">
            <Zap className="h-4 w-4 md:h-5 md:w-5 text-accent animate-pulse" />
            <span className="text-foreground/90 font-medium">Simple, transparent, scalable</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-bold">
            <span className="text-gradient-animated">Tarifs</span> adaptés à vos besoins
          </h1>
          <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto px-2">
            Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center mt-8 md:mt-12 mb-8 md:mb-12">
            <div className="relative inline-flex items-center p-1.5 rounded-full bg-secondary/30 border border-border backdrop-blur-sm">
              {/* Sliding Background Pill */}
              <div
                className={`absolute inset-y-1.5 rounded-full bg-background shadow-sm transition-all duration-300 ease-out ${billingCycle === "monthly" ? "left-1.5 w-[calc(50%-6px)]" : "left-[calc(50%)] w-[calc(50%-6px)]"
                  }`}
              />

              <button
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 px-6 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${billingCycle === "monthly"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
                  }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 px-6 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${billingCycle === "yearly"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
                  }`}
              >
                Annuel
              </button>

              {/* Modern Badge - Only visible when Yearly is selected and on larger screens */}
              <div
                className={`absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center transition-all duration-300 ${billingCycle === "yearly"
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2 pointer-events-none"
                  }`}
              >
                {/* Arrow */}
                <div className="w-4 h-px bg-primary/30 mr-2 relative overflow-visible">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-primary/30 rotate-45" />
                </div>

                <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-sm whitespace-nowrap">
                  <Sparkles className="w-3 h-3 fill-primary" />
                  <span>-25% (2 mois offerts)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-24">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col rounded-2xl transition-all duration-500 ${plan.popular
                ? "border-primary/50 shadow-glow scale-105 z-10"
                : "border-border/50 hover:border-primary/30 hover:shadow-card hover:-translate-y-1"
                }`}
            >
              {(plan.popular || plan.badge) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{plan.badge || "Plus populaire"}</span>
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-xl font-bold mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mt-4 mb-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-gradient' : ''}`}>
                      {plan.price}
                    </span>
                    <span className="text-foreground/60 text-sm font-medium">{plan.period}</span>
                  </div>
                  {plan.billingNote && (
                    <p className="text-xs text-foreground/50 mt-1 h-4">
                      {plan.billingNote}
                    </p>
                  )}
                  {!plan.billingNote && <div className="h-5" />} {/* Spacer for alignment */}
                </div>
                <p className="text-foreground/70 text-sm min-h-[40px]">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-6">
                <Button
                  variant={plan.popular ? "solid" : plan.variant}
                  className={`w-full rounded-xl font-bold ${plan.popular
                    ? 'shadow-lg shadow-primary/20 hover:shadow-primary/40'
                    : ''
                    }`}
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </Button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mr-2.5 mt-0.5 flex-shrink-0" />
                      <div className="text-foreground/80 leading-tight">
                        {feature}
                      </div>
                    </div>
                  ))}
                  {plan.limitations?.map((limitation, i) => (
                    <div key={i} className="flex items-start text-sm opacity-50">
                      <div className="h-4 w-4 mr-2.5 mt-0.5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                      </div>
                      <span className="text-foreground/60">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Packs Section */}
        <div className="max-w-4xl mx-auto text-center border-t border-border/50 pt-16">
          <h2 className="text-3xl font-bold mb-4">
            Pas prêt pour un abonnement ?
          </h2>
          <p className="text-lg text-foreground/70 mb-2">
            Prenez un Pack Liberté.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-foreground/60 mb-10 mx-auto">
            <HelpCircle className="w-4 h-4" />
            <span>Pas de renouvellement automatique. Utilisez vos crédits quand vous voulez.</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {packs.map((pack) => (
              <Card key={pack.name} className="relative group overflow-hidden bg-secondary/10 border-border/50 hover:bg-secondary/20 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardContent className="p-6 flex flex-col items-center text-center gap-5 relative z-10">
                  <div className="p-3.5 bg-background rounded-2xl shadow-sm ring-1 ring-inset ring-foreground/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <pack.icon className="w-7 h-7 text-primary" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-xl">{pack.name}</h3>
                    <p className="text-muted-foreground font-medium">{pack.credits}</p>
                  </div>

                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{pack.price}</span>
                  </div>

                  <Button variant="outline" className="w-full rounded-xl font-bold hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary transition-all duration-300">
                    {pack.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center space-y-4 animate-fade-in-up">
          <p className="text-foreground/70 text-lg font-medium">
            Toutes les cartes bancaires acceptées • Annulation à tout moment
          </p>
          <p className="text-base text-foreground/60">
            Des questions ? {" "}
            <a href="mailto:contact@slideai.com" className="text-primary hover:text-accent transition-colors font-semibold">
              Contactez-nous
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
