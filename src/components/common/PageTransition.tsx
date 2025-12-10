import { motion } from "framer-motion";
import React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <>
      {/* 1. THE "DIFFUSED" OVERLAY (The Mist) */}
      {/* <motion.div
        className="fixed inset-0 z-[999999] bg-brand-50 dark:bg-gray-950 pointer-events-none"
        
        initial={{ "--r": "0%" } as Record<string, string>}
        animate={{ "--r": "200%" } as Record<string, string>}
        exit={{ "--r": "0%" } as Record<string, string>}
        
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} 
        
        style={{
            WebkitMaskImage: "radial-gradient(circle, transparent var(--r), black calc(var(--r) + 50%))",
            maskImage: "radial-gradient(circle, transparent var(--r), black calc(var(--r) + 50%))",
        } as React.CSSProperties}
      /> */}

      {/* 2. THE CONTENT ANIMATION (The Reveal) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}  // Start slightly blurred, small, invisible
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}     // End sharp, full size, visible
        exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}     // Exit slightly blurred
        
        transition={{ 
          duration: 0.4, 
          delay: 0.2,
          ease: "easeOut" 
        }}
      >
        {children}
      </motion.div>
    </>
  );
}