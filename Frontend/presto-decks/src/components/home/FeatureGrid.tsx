import { motion } from "framer-motion";
import { Zap, Palette, Brain, Sparkles, Clock, Share2, Settings, Layers } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Génération Rapide",
    description: "Créez des présentations complètes en quelques secondes avec l'IA",
    icon: Zap,
    size: "col-span-1 row-span-1",
    gradient: "from-primary/20 to-secondary/20",
    accent: "primary",
  },
  {
    id: 2,
    title: "Design Intelligent",
    description: "Algorithmes qui comprennent le design moderne et les tendances actuelles",
    icon: Brain,
    size: "col-span-1 md:col-span-2 row-span-1",
    gradient: "from-secondary/20 to-accent/20",
    accent: "secondary",
  },
  {
    id: 3,
    title: "Palettes Infinies",
    description: "Accès à des milliers de combinaisons de couleurs et de thèmes",
    icon: Palette,
    size: "col-span-1 row-span-2",
    gradient: "from-accent/20 to-primary/20",
    accent: "accent",
  },
  {
    id: 4,
    title: "Animations Fluides",
    description: "Des transitions et animations sophistiquées pour captiver votre audience",
    icon: Sparkles,
    size: "col-span-1 row-span-1",
    gradient: "from-primary/20 to-accent/20",
    accent: "primary",
  },
  {
    id: 5,
    title: "Édition Rapide",
    description: "Modificateurs en temps réel avec preview instantanée",
    icon: Clock,
    size: "col-span-1 row-span-1",
    gradient: "from-secondary/20 to-primary/20",
    accent: "secondary",
  },
  {
    id: 6,
    title: "Partage Social",
    description: "Exportez et partagez vos présentations sur tous les réseaux",
    icon: Share2,
    size: "col-span-1 md:col-span-2 row-span-1",
    gradient: "from-accent/20 to-secondary/20",
    accent: "accent",
  },
];

export function FeatureGrid() {
  return (
    <section className="relative py-20 md:py-32 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-sm">
            <Layers className="w-4 h-4 text-secondary" />
            <span className="text-foreground/80">Capacités</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Des outils puissants<br />
            <span className="text-gradient-secondary">conçus pour vous</span>
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto mt-4">
            Tout ce dont vous avez besoin pour créer des présentations professionnelles sans effort
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-max">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLarge = feature.size.includes("md:col-span-2");
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`${feature.size} group`}
              >
                <div className={`glass-premium p-6 md:p-8 h-full rounded-2xl border border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden relative`}>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />
                  
                  {/* Animated accent line */}
                  <div className={`absolute top-0 left-0 h-1 bg-gradient-to-r from-${feature.accent} to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative z-10 space-y-4">
                    <motion.div 
                      className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300"
                      whileHover={{ rotate: 10 }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>

                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm md:text-base text-foreground/60 group-hover:text-foreground/80 transition-colors mt-2 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover indicator */}
                    <motion.div 
                      className="flex items-center gap-2 text-sm text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span className="font-medium">En savoir plus</span>
                      <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        →
                      </motion.span>
                    </motion.div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300 -z-10" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 md:mt-20"
        >
          <p className="text-foreground/70 text-base md:text-lg">
            Et bien d'autres fonctionnalités à découvrir...
          </p>
        </motion.div>
      </div>
    </section>
  );
}
