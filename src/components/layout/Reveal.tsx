"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Vertical offset (px) the content travels in from. */
  y?: number;
  /** Reveal as a group — pass to children via variants when `stagger` is used on a parent. */
  as?: "div" | "section";
}

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

/** Fades + slides content up as it scrolls into view. Plays once. */
export function Reveal({ children, delay = 0, className, y = 28, as = "div" }: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
      variants={y === 28 ? variants : undefined}
    >
      {children}
    </Component>
  );
}

/** Wrap a grid/list with this and give each child a Reveal (or RevealItem) to stagger their entrance. */
export function RevealGroup({ children, className, stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: stagger }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={variants} transition={{ duration: 0.7, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}
