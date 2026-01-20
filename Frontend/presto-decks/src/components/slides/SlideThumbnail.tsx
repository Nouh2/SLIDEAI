import { type Example } from "@/data/examples";
import { ModernSlideRenderer } from "./ModernSlideRenderer";

interface SlideThumbnailProps {
  example: Example;
}

export const SlideThumbnail = ({ example }: SlideThumbnailProps) => {
  const firstSlide = example.slides[0];

  if (!firstSlide) return null;

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-lg">
      <div className="scale-50 origin-top-left w-[200%] h-[200%]">
        <ModernSlideRenderer
          slide={firstSlide}
          theme={example.theme}
          colorPalette={example.colorPalette}
          className="w-full h-full"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
};
