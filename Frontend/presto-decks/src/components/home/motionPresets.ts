import type { Transition, Variants } from "framer-motion";

/**
 * Cheap reveal presets — opacity + translateY only.
 * Filter:blur reveals were killing low-end CPUs on scroll. Removed entirely.
 * GPU-accelerated transform/opacity stays smooth on integrated graphics.
 */
export const premiumEase = [0.16, 1, 0.3, 1] as const;

export const premiumTransition: Transition = {
  duration: 0.55,
  ease: premiumEase,
};

export const mobileTransition: Transition = {
  duration: 0.42,
  ease: premiumEase,
};

export const viewportPreset = {
  once: true,
  amount: 0.05,
  margin: "0px 0px -8% 0px",
} as const;

export const createRevealVariants = (isMobile = false, offset = 24): Variants => ({
  hidden: {
    opacity: 0,
    y: isMobile ? Math.min(offset, 12) : offset,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: isMobile ? mobileTransition : premiumTransition,
  },
});

export const createCardVariants = (isMobile = false): Variants =>
  createRevealVariants(isMobile, isMobile ? 12 : 22);

export const createStaggerContainer = (isMobile = false): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: isMobile ? 0.05 : 0.07,
      delayChildren: isMobile ? 0.02 : 0.04,
    },
  },
});
