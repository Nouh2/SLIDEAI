import type { Transition, Variants } from "framer-motion";

export const premiumEase = [0.16, 1, 0.3, 1] as const;

export const premiumTransition: Transition = {
  duration: 0.82,
  ease: premiumEase,
};

export const mobileTransition: Transition = {
  duration: 0.72,
  ease: premiumEase,
};

export const viewportPreset = {
  once: true,
  amount: 0.24,
  margin: "0px 0px -12% 0px",
} as const;

export const createRevealVariants = (isMobile = false, offset = 28): Variants => ({
  hidden: {
    opacity: 0,
    y: isMobile ? Math.min(offset, 14) : offset,
    filter: `blur(${isMobile ? 6 : 10}px)`,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: isMobile ? mobileTransition : premiumTransition,
  },
});

export const createCardVariants = (isMobile = false): Variants =>
  createRevealVariants(isMobile, isMobile ? 14 : 28);

export const createStaggerContainer = (isMobile = false): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: isMobile ? 0.075 : 0.095,
      delayChildren: isMobile ? 0.04 : 0.06,
    },
  },
});
