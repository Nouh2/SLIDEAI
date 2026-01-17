import { motion } from "framer-motion";
import { Star, Users, TrendingUp } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Emma Rodriguez",
    title: "Founder, TechStudio",
    avatar: "🎨",
    quote: "SlideAI a transformé mon processus de création. Je gagne 10 heures par semaine!",
    rating: 5,
  },
  {
    id: 2,
    name: "Marc Durand",
    title: "Marketing Director",
    avatar: "📊",
    quote: "Les designs générés sont professionnels et précis. Aucun ajustement nécessaire.",
    rating: 5,
  },
  {
    id: 3,
    name: "Sophie Leclerc",
    title: "Consultant en Innovation",
    avatar: "✨",
    quote: "Finalement une solution simple pour créer des présentations impactantes.",
    rating: 5,
  },
];

const stats = [
  { label: "Présentations créées", value: "50K+", icon: TrendingUp },
  { label: "Utilisateurs actifs", value: "12K+", icon: Users },
  { label: "Satisfaction client", value: "98%", icon: Star },
];

export function SocialProof() {
  return (
    <section className="relative py-12 md:py-32 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-60 md:w-96 h-60 md:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-60 md:w-80 h-60 md:h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-premium rounded-2xl p-6 md:p-8 text-center border border-primary/10 group hover:border-primary/30 transition-all"
              >
                <motion.div
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                </motion.div>
                <p className="text-3xl md:text-5xl font-bold text-gradient mb-2 md:mb-3">
                  {stat.value}
                </p>
                <p className="text-foreground/60 text-sm md:text-base font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              Aimé par les<br />
              <span className="text-gradient-secondary">équipes créatives</span>
            </h2>
            <p className="text-base md:text-lg text-foreground/60 max-w-2xl mx-auto px-2">
              Découvrez comment SlideAI a aidé des milliers de professionnels à créer des présentations exceptionnelles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="glass-premium rounded-2xl p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground/80 text-base leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                  <div className="text-3xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {testimonial.title}
                    </p>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-6"
        >
          <p className="text-sm text-foreground/60 font-medium uppercase tracking-wider">Certifié par</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {["🏆 Top Startup", "⭐ 4.9/5 Stars", "🔒 Sécurisé"].map((badge, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.1 }}
                className="px-4 py-2 rounded-full glass-premium border border-primary/10 text-sm font-medium text-foreground/70"
              >
                {badge}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
