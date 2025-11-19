import { type Slide } from "@/data/examples";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideRendererProps {
  slide: Slide;
  theme: string;
  className?: string;
}

const themeStyles = {
  "Modern-01": {
    bg: "bg-gradient-to-br from-[#0B0F19] to-[#111827]",
    text: "text-white",
    accent: "text-[#5B8CFF]",
    bullet: "bg-[#5B8CFF]",
  },
  "Minimal-Grid": {
    bg: "bg-gradient-to-br from-white to-gray-50",
    text: "text-gray-900",
    accent: "text-[#0EA5E9]",
    bullet: "bg-[#0EA5E9]",
  },
  "Bold-Contrast": {
    bg: "bg-black",
    text: "text-white",
    accent: "text-[#F59E0B]",
    bullet: "bg-[#F59E0B]",
  },
};

const getImageForSlide = (title: string): string => {
  const imageMap: Record<string, string> = {
    "Problème & Opportunité": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    "Solution": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
    "Traction": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    "Introduction : définitions & enjeux": "https://images.unsplash.com/photo-1569163139394-de4798aa62b5?w=800&h=600&fit=crop",
    "Causes principales": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop",
    "Conséquences": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    "Objectifs Q3": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    "Canaux": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop",
  };
  
  return imageMap[title] || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop";
};

const IconComponent = ({ name }: { name: string }) => {
  const iconName = name.split("-").map((part, i) => 
    i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1)
  ).join("") as keyof typeof LucideIcons;
  
  const Icon = LucideIcons[iconName] as React.ComponentType<{ className?: string }>;
  
  if (!Icon) return null;
  
  return <Icon className="w-full h-full" />;
};

export const SlideRenderer = ({ slide, theme, className }: SlideRendererProps) => {
  const styles = themeStyles[theme as keyof typeof themeStyles] || themeStyles["Modern-01"];
  const imageUrl = getImageForSlide(slide.title);

  const renderLayout = () => {
    switch (slide.layout) {
      case "title-left-bullets-right-illustration":
        return (
          <div className={cn("relative h-full min-h-[400px] overflow-hidden rounded-lg", styles.bg, className)}>
            <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
              <div className="flex flex-col justify-center space-y-6">
                <h2 className={cn("text-3xl md:text-4xl font-bold", styles.text, styles.accent)}>
                  {slide.title}
                </h2>
                <ul className="space-y-4">
                  {slide.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <span className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", styles.bullet)} />
                      <span className={cn("text-base md:text-lg", styles.text)}>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-center">
                {slide.illustration.type === "icon" ? (
                  <div className={cn("w-48 h-48 opacity-20", styles.accent)}>
                    <IconComponent name={slide.illustration.name} />
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt={slide.title}
                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case "title-top-bullets-bottom":
        return (
          <div className={cn("relative h-full min-h-[400px] overflow-hidden rounded-lg", className)}>
            <div className="absolute inset-0">
              <img 
                src={imageUrl} 
                alt={slide.title}
                className="w-full h-full object-cover opacity-20"
              />
            </div>
            <div className={cn("relative z-10 h-full flex flex-col p-8", styles.bg, "bg-opacity-90")}>
              <h2 className={cn("text-3xl md:text-5xl font-bold text-center mb-8", styles.text, styles.accent)}>
                {slide.title}
              </h2>
              <div className="flex-1 flex items-center justify-center">
                <ul className="space-y-4 max-w-2xl">
                  {slide.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <span className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0", styles.bullet)} />
                      <span className={cn("text-lg md:text-xl", styles.text)}>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case "title-top-columns":
        return (
          <div className={cn("relative h-full min-h-[400px] overflow-hidden rounded-lg", styles.bg, className)}>
            <div className="p-8 space-y-8">
              <h2 className={cn("text-3xl md:text-5xl font-bold text-center", styles.text, styles.accent)}>
                {slide.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {slide.bullets.map((bullet, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-6 rounded-lg border-2 backdrop-blur-sm animate-fade-in",
                      theme === "Minimal-Grid" ? "bg-white border-gray-200" : "bg-white/5 border-white/10"
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={cn("w-8 h-8 rounded-full mb-4", styles.bullet)} />
                    <p className={cn("text-base", styles.text)}>{bullet}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-8">
                <img 
                  src={imageUrl} 
                  alt={slide.title}
                  className="w-2/3 h-40 object-cover rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        );

      case "title-left-metrics-right":
        return (
          <div className={cn("relative h-full min-h-[400px] overflow-hidden rounded-lg", styles.bg, className)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 h-full">
              <div className="flex flex-col justify-center">
                <h2 className={cn("text-4xl md:text-5xl font-bold mb-8", styles.text, styles.accent)}>
                  {slide.title}
                </h2>
                {slide.illustration.type === "icon" && (
                  <div className={cn("w-24 h-24 opacity-30", styles.accent)}>
                    <IconComponent name={slide.illustration.name} />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center space-y-6">
                {slide.bullets.map((bullet, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-6 rounded-lg border-2 backdrop-blur-sm animate-scale-in",
                      theme === "Minimal-Grid" ? "bg-white border-gray-200" : "bg-white/5 border-white/10"
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <p className={cn("text-2xl md:text-3xl font-bold", styles.accent)}>{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={cn("relative h-full min-h-[400px] overflow-hidden rounded-lg", styles.bg, className)}>
            <div className="p-8">
              <h2 className={cn("text-3xl font-bold mb-6", styles.text)}>{slide.title}</h2>
              <ul className="space-y-4">
                {slide.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={cn("w-2 h-2 rounded-full mt-2", styles.bullet)} />
                    <span className={cn("text-lg", styles.text)}>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
    }
  };

  return renderLayout();
};
