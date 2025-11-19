import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0€",
      period: "/mois",
      description: "Pour tester et découvrir",
      features: [
        "3 présentations par mois",
        "Templates de base",
        "Export PDF",
        "Watermark SlideAI",
      ],
      limitations: [
        "Pas d'export PowerPoint",
        "Pas de Brand Kit",
      ],
      cta: "Commencer gratuitement",
      variant: "outline" as const,
      popular: false,
      badge: null,
    },
    {
      name: "Étudiant",
      price: "10€",
      period: "/mois",
      description: "Pour étudiants et usage occasionnel",
      features: [
        "10 présentations par mois",
        "Slides illimitées par présentation",
        "Tous les templates premium",
        "Export PowerPoint + PDF",
        "Pas de watermark",
        "Support standard",
      ],
      limitations: [],
      cta: "Commencer avec Étudiant",
      variant: "outline" as const,
      popular: false,
      badge: "Plus populaire chez les étudiants",
    },
    {
      name: "Pro",
      price: "19€",
      period: "/mois",
      description: "Pour les professionnels",
      features: [
        "Présentations illimitées",
        "Tous les templates premium",
        "Export PowerPoint + PDF + Google Slides",
        "Brand Kit personnalisé",
        "Optimisations IA avancées",
        "Support prioritaire",
        "Pas de watermark",
      ],
      cta: "Essayer Pro gratuitement",
      variant: "solid" as const,
      popular: true,
      badge: "Plus populaire",
    },
    {
      name: "Business",
      price: "99€",
      period: "/mois",
      description: "Pour les équipes",
      features: [
        "Tout de Pro, plus :",
        "Templates d'équipe partagés",
        "Collaboration temps réel",
        "SSO (Single Sign-On)",
        "Gestion des utilisateurs",
        "Analytics avancées",
        "Support prioritaire 24/7",
        "Onboarding personnalisé",
      ],
      cta: "Contacter les ventes",
      variant: "solid" as const,
      popular: false,
      badge: null,
    },
  ];

  return (
    <div className="py-20">
      <section className="container">
          <div className="text-center space-y-6 mb-20 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 rounded-full glass px-6 py-3 text-sm mb-4">
              <Zap className="h-5 w-5 text-accent animate-pulse" />
              <span className="text-foreground/90 font-medium">Simple, transparent, scalable</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-gradient-animated">Tarifs</span> simples et transparents
            </h1>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. 
              Changez ou annulez à tout moment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative card-premium transition-all duration-500 hover:scale-105 ${
                  plan.popular
                    ? "border-primary/50 shadow-glow animate-gradient"
                    : "hover:shadow-card"
                }`}
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  ...(plan.popular && {
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
                  })
                }}
              >
                {(plan.popular || plan.badge) && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex flex-col items-center gap-1.5 rounded-full gradient-aurora px-5 py-3 text-[11px] font-bold text-white shadow-glow animate-glow-pulse w-[140px]">
                      <Sparkles className="h-4 w-4 flex-shrink-0" />
                      <span className="text-center leading-[1.3] break-words">{plan.badge || "Plus populaire"}</span>
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-14">
                  <CardTitle className="text-3xl font-bold mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-6">
                    <span className={`text-6xl font-bold ${plan.popular ? 'text-gradient' : ''}`}>
                      {plan.price}
                    </span>
                    <span className="text-foreground/60 text-lg">{plan.period}</span>
                  </div>
                  <p className="text-foreground/70 mt-3 text-base">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6 pb-8">
                  <Button
                    variant={plan.popular ? "solid" : plan.variant}
                    size="lg"
                    className={`w-full h-14 rounded-2xl font-bold text-base ${
                      plan.popular 
                        ? 'shadow-glow hover:scale-105' 
                        : 'hover:scale-105'
                    } transition-all duration-300`}
                    asChild
                  >
                    <Link to="/app">{plan.cta}</Link>
                  </Button>

                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground/90">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, i) => (
                      <li key={i} className="flex items-start opacity-40">
                        <span className="text-sm line-through text-foreground/60">
                          {limitation}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
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
