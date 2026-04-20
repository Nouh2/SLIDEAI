import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { Analytics } from "@/lib/analytics";

const DEMO_VIDEO_SRC = "/landing-video-hyperframes/slideai-demo-50s.mp4";
const DEMO_POSTER_SRC = "/landing-video-hyperframes/slideai-demo-50s-poster.jpg";

export function DemoFlowSection() {
  const { i18n } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isFr = i18n.language.startsWith("fr");

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setHasStarted(true);
      setIsPlaying(true);
      Analytics.trackEvent("Video", "Play", "Landing Hero Demo Video");
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative w-full pt-4 md:pt-4">
      <div className="mx-auto max-w-6xl">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2.4rem] bg-gradient-to-r from-primary/20 via-transparent to-amber-400/20 blur-3xl opacity-70" />

          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/90 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border/60 bg-background/95 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
              <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {isFr ? "Demo produit" : "Product demo"}
              </span>
            </div>

            <div className="relative aspect-video bg-muted/30">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                poster={DEMO_POSTER_SRC}
                preload="metadata"
                playsInline
                controls={hasStarted}
                onPlay={() => {
                  setHasStarted(true);
                  setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              >
                <source src={DEMO_VIDEO_SRC} type="video/mp4" />
              </video>

              {!isPlaying && (
                <button
                  type="button"
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/25 via-black/5 to-transparent transition-opacity hover:from-black/30"
                  aria-label={isFr ? "Lire la demo produit" : "Play product demo"}
                >
                  <span className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/92 px-5 py-3 text-sm md:text-base font-bold text-foreground shadow-xl backdrop-blur">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-white shadow-lg">
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </span>
                    {isFr ? "Lire la demo" : "Play demo"}
                  </span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
