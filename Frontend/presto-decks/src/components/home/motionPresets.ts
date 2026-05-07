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
    y: isMobile ? Math.min(offset, 18) : offset,
    filter: isMobile ? "none" : "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: isMobile ? mobileTransition : premiumTransition,
  },
});

export const createCardVariants = (isMobile = false): Variants => ({
  hidden: {
    opacity: 0,
    y: isMobile ? 16 : 34,
    scale: isMobile ? 1 : 0.985,
    filter: isMobile ? "none" : "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: isMobile ? mobileTransition : premiumTransition,
  },
});

export const createStaggerContainer = (isMobile = false): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: isMobile ? 0.075 : 0.095,
      delayChildren: isMobile ? 0.04 : 0.06,
    },
  },
});
