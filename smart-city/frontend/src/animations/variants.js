/**
 * Reusable animation variants for Framer Motion
 * Centralized so every component uses consistent timing/easing
 */

// Page-level fade + slide-up
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};

export const pageTransition = {
  duration: 0.45,
  ease: [0.25, 0.46, 0.45, 0.94], // custom ease-out-quart
};

// Stagger container — children animate one after another
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

// Individual stagger item
export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
};

// Card hover interaction
export const cardHover = {
  whileHover: { scale: 1.025, y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  whileTap: { scale: 0.97 },
};

// Button click
export const buttonTap = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.95 },
};

// Success checkmark bounce
export const successPop = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 16, delay: 0.1 },
  },
};

// Shake animation for errors
export const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, 0],
    transition: { duration: 0.5 },
  },
  idle: { x: 0 },
};

// Fade-in for list items
export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 280, damping: 22 },
  }),
};

// Status badge color transition
export const badgePop = {
  initial: { scale: 0.85, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 18 } },
};
