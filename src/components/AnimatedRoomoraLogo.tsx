import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface AnimatedRoomoraLogoProps {
  /**
   * Size preset ('sm' = 36px, 'md' = 44px (default navbar), 'lg' = 64px) or custom pixel size.
   */
  size?: 'sm' | 'md' | 'lg' | number;
  /**
   * Additional Tailwind or CSS classes for the outer container.
   */
  className?: string;
  /**
   * Enable interactive hover & tap spring effects.
   */
  interactive?: boolean;
  /**
   * Display the soft ambient neon halo behind the sign fixture.
   */
  showHalo?: boolean;
}

// ---------------------------------------------------------------------------
// Stable, hardware-accelerated neon keyframes
// Defined at module level so React re-renders never reset or glitch the loop
// ---------------------------------------------------------------------------
export const NEON_SIGN_DURATION = 5.4;

export const NEON_KEYFRAME_TIMES = [0, 0.28, 0.52, 0.63, 0.66, 0.81, 1];

// Layered neon illumination:
// 1. Sharp inner core glow (white / light cyan)
// 2. Immediate luminous turquoise gas envelope
// 3. Medium surrounding electric teal radiance
// 4. Soft ambient cyan atmosphere
export const NEON_FILTER_KEYFRAMES = [
  // 0.0s (0): Baseline luminous neon glow
  'drop-shadow(0px 0px 1.0px rgba(240, 253, 250, 0.95)) drop-shadow(0px 0px 3.5px rgba(45, 212, 191, 0.90)) drop-shadow(0px 0px 10.0px rgba(20, 184, 166, 0.80)) drop-shadow(0px 0px 20.0px rgba(13, 148, 136, 0.60))',
  // 1.5s (0.28): Deep ambient swell - breathing in
  'drop-shadow(0px 0px 1.5px rgba(255, 255, 255, 1.00)) drop-shadow(0px 0px 5.5px rgba(94, 234, 212, 0.95)) drop-shadow(0px 0px 14.0px rgba(45, 212, 191, 0.90)) drop-shadow(0px 0px 28.0px rgba(20, 184, 166, 0.75))',
  // 2.8s (0.52): Settling back to steady warmth
  'drop-shadow(0px 0px 1.1px rgba(240, 253, 250, 0.92)) drop-shadow(0px 0px 3.8px rgba(45, 212, 191, 0.88)) drop-shadow(0px 0px 10.5px rgba(20, 184, 166, 0.78)) drop-shadow(0px 0px 21.0px rgba(13, 148, 136, 0.58))',
  // 3.4s (0.63): Organic electrical micro-dip (subtle ionization current shift)
  'drop-shadow(0px 0px 0.7px rgba(204, 251, 241, 0.78)) drop-shadow(0px 0px 2.2px rgba(20, 184, 166, 0.72)) drop-shadow(0px 0px 6.5px rgba(13, 148, 136, 0.62)) drop-shadow(0px 0px 14.0px rgba(13, 148, 136, 0.38))',
  // 3.55s (0.66): Instant electric surge rebound
  'drop-shadow(0px 0px 1.6px rgba(255, 255, 255, 1.00)) drop-shadow(0px 0px 5.0px rgba(94, 234, 212, 0.95)) drop-shadow(0px 0px 13.0px rgba(45, 212, 191, 0.88)) drop-shadow(0px 0px 26.0px rgba(20, 184, 166, 0.72))',
  // 4.4s (0.81): Warm steady luminescence
  'drop-shadow(0px 0px 1.2px rgba(240, 253, 250, 0.94)) drop-shadow(0px 0px 4.0px rgba(45, 212, 191, 0.90)) drop-shadow(0px 0px 11.0px rgba(20, 184, 166, 0.80)) drop-shadow(0px 0px 22.0px rgba(13, 148, 136, 0.62))',
  // 5.4s (1.0): Seamless loop return to baseline
  'drop-shadow(0px 0px 1.0px rgba(240, 253, 250, 0.95)) drop-shadow(0px 0px 3.5px rgba(45, 212, 191, 0.90)) drop-shadow(0px 0px 10.0px rgba(20, 184, 166, 0.80)) drop-shadow(0px 0px 20.0px rgba(13, 148, 136, 0.60))',
];

export const NEON_OPACITY_KEYFRAMES = [1.0, 1.0, 0.98, 0.91, 1.0, 0.98, 1.0];

const HALO_OPACITY_KEYFRAMES = [0.42, 0.72, 0.48, 0.35, 0.78, 0.50, 0.42];
const HALO_SCALE_KEYFRAMES = [0.96, 1.06, 0.98, 0.94, 1.07, 0.99, 0.96];

export const AnimatedRoomoraLogo: React.FC<AnimatedRoomoraLogoProps> = ({
  size = 'md',
  className = '',
  interactive = true,
  showHalo = true
}) => {
  const reactId = useId();
  const shouldReduceMotion = useReducedMotion();

  // Unique ID tokens for SVG defs to avoid collisions across multiple instances
  const uid = reactId.replace(/:/g, '');
  const tealGradId = `rm-teal-${uid}`;
  const cyanGradId = `rm-cyan-${uid}`;
  const fillGradId = `rm-fill-${uid}`;
  const beaconGradId = `rm-beacon-${uid}`;

  // Dimensions
  let pixelSize = 44;
  let roundedClass = 'rounded-2xl';

  if (typeof size === 'number') {
    pixelSize = size;
    roundedClass = size >= 56 ? 'rounded-2xl' : size <= 38 ? 'rounded-xl' : 'rounded-2xl';
  } else if (size === 'sm') {
    pixelSize = 36;
    roundedClass = 'rounded-xl';
  } else if (size === 'lg') {
    pixelSize = 64;
    roundedClass = 'rounded-2xl';
  }

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      whileHover={interactive ? { scale: 1.08, y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      aria-label="Roomora Brand Logo - Continuously Illuminated Teal Neon Sign"
      role="img"
    >
      {/* 1. LAYER: Soft Ambient Neon Halo (Casts authentic teal light onto navbar) */}
      {showHalo && (
        <motion.div
          className={`absolute -inset-2 ${roundedClass} bg-gradient-to-r from-teal-400/40 via-cyan-400/35 to-emerald-400/40 blur-xl pointer-events-none -z-10`}
          animate={
            shouldReduceMotion
              ? { opacity: 0.55, scale: 1 }
              : {
                  opacity: HALO_OPACITY_KEYFRAMES,
                  scale: HALO_SCALE_KEYFRAMES
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: NEON_SIGN_DURATION,
                  times: NEON_KEYFRAME_TIMES,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
          }
        />
      )}

      {/* 2. LAYER: High-Contrast Smoked Crystal Neon Plaque Backing */}
      <motion.div
        className={`w-full h-full ${roundedClass} relative overflow-hidden flex items-center justify-center border transition-all duration-300
          bg-gradient-to-br from-[#060e16] via-[#091724] to-[#041a20]
          border-teal-400/50 dark:border-teal-400/60
          shadow-[0_0_18px_rgba(20,184,166,0.40),0_0_36px_rgba(45,212,191,0.20)]
          dark:shadow-[0_0_22px_rgba(20,184,166,0.60),0_0_44px_rgba(45,212,191,0.32)]
        `}
        animate={
          shouldReduceMotion
            ? { y: 0 }
            : {
                y: [-1, 1, -1]
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 4.8,
                repeat: Infinity,
                ease: 'easeInOut'
              }
        }
      >
        {/* Subtle glass reflection & luminous neon tube inner border */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-teal-300/10 to-white/15 pointer-events-none" />
        <div className="absolute inset-[1px] rounded-[inherit] border border-teal-400/25 pointer-events-none" />

        {/* 3. LAYER: Base SVG (Gradients, ground reflection, and translucent interior wash) */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[86%] h-[86%] absolute inset-0 m-auto pointer-events-none"
        >
          <defs>
            {/* Primary Neon Teal Gradient */}
            <linearGradient id={tealGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Vibrant Cyan Accent Gradient */}
            <linearGradient id={cyanGradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Subtle Inner Gas Chamber Glow (Translucent, does not muddy the inner neon tubes) */}
            <linearGradient id={fillGradId} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#0d9488" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#042f2e" stopOpacity="0.03" />
            </linearGradient>

            {/* Luminous Neon Bulb Core */}
            <radialGradient id={beaconGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ccfbf1" />
              <stop offset="70%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
          </defs>

          {/* Translucent Gas Interior Wash */}
          <path
            d="M 24 7.5 L 36.5 17 L 36.5 25 C 36.5 32 28.5 38.5 24 41.5 C 19.5 38.5 11.5 32 11.5 25 L 11.5 17 Z"
            fill={`url(#${fillGradId})`}
          />

          {/* Base Ground Reflection / Radar Ripple */}
          <ellipse
            cx="24"
            cy="43.5"
            rx="5.5"
            ry="1.4"
            fill={`url(#${tealGradId})`}
            opacity="0.65"
          />
        </svg>

        {/* 4. LAYER: Master Neon Tubes SVG - Continuously Glowing & Breathing */}
        {/* Isolated from the background fill so the multi-layered drop-shadow illuminates only the neon tubes! */}
        <motion.svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[86%] h-[86%] relative z-10"
          animate={
            shouldReduceMotion
              ? {
                  filter: NEON_FILTER_KEYFRAMES[0],
                  opacity: 1
                }
              : {
                  filter: NEON_FILTER_KEYFRAMES,
                  opacity: NEON_OPACITY_KEYFRAMES
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: NEON_SIGN_DURATION,
                  times: NEON_KEYFRAME_TIMES,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
          }
        >
          {/* Reuse defs from above */}
          <defs>
            <linearGradient id={`${tealGradId}-t`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id={`${cyanGradId}-t`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <radialGradient id={`${beaconGradId}-t`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#ccfbf1" />
              <stop offset="70%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
          </defs>

          {/* TUBE 1: Location Pin & House Body Neon Tube */}
          {/* Outer colored gas tube */}
          <path
            d="M 24 7.5 L 36.5 17 L 36.5 25 C 36.5 32 28.5 38.5 24 41.5 C 19.5 38.5 11.5 32 11.5 25 L 11.5 17 Z"
            stroke={`url(#${cyanGradId}-t)`}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner white-hot electric core filament */}
          <path
            d="M 24 7.5 L 36.5 17 L 36.5 25 C 36.5 32 28.5 38.5 24 41.5 C 19.5 38.5 11.5 32 11.5 25 L 11.5 17 Z"
            stroke="#f0fdfa"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />

          {/* TUBE 2: Architectural Pitch Roof with Overhanging Eaves Neon Tube */}
          {/* Outer colored gas tube */}
          <path
            d="M 7.5 18.5 L 24 6.5 L 40.5 18.5"
            stroke={`url(#${tealGradId}-t)`}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner white-hot electric core filament */}
          <path
            d="M 7.5 18.5 L 24 6.5 L 40.5 18.5"
            stroke="#ffffff"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* TUBE 3: Cozy Chimney Neon Tube */}
          {/* Outer colored gas tube */}
          <path
            d="M 31.5 12.5 V 9.5 H 34.5 V 14.8"
            stroke={`url(#${tealGradId}-t)`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner white-hot electric core filament */}
          <path
            d="M 31.5 12.5 V 9.5 H 34.5 V 14.8"
            stroke="#f0fdfa"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* TUBE 4: Welcoming Community Arch / Shared Entry Doorway Neon Tube */}
          {/* Outer colored gas tube */}
          <path
            d="M 20.5 39.5 V 31 A 3.5 3.5 0 0 1 27.5 31 V 39.5"
            stroke={`url(#${tealGradId}-t)`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner white-hot electric core filament */}
          <path
            d="M 20.5 39.5 V 31 A 3.5 3.5 0 0 1 27.5 31 V 39.5"
            stroke="#ffffff"
            strokeWidth="1.0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* TUBE 5: Roommate Connection Arc Neon Tube */}
          {/* Outer colored gas tube */}
          <path
            d="M 18.5 23.5 Q 24 26.5 29.5 23.5"
            stroke={`url(#${cyanGradId}-t)`}
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Inner white-hot core filament */}
          <path
            d="M 18.5 23.5 Q 24 26.5 29.5 23.5"
            stroke="#f0fdfa"
            strokeWidth="0.85"
            strokeLinecap="round"
          />

          {/* BULB A: Roommate Node Left (Illuminated gas bulb with gentle pulse) */}
          <motion.circle
            cx="18.5"
            cy="23.5"
            r="2.6"
            fill={`url(#${beaconGradId}-t)`}
            stroke="#5eead4"
            strokeWidth="0.8"
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 1 }
                : {
                    scale: [1, 1.16, 1],
                    opacity: [0.92, 1, 0.92]
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: 2.7,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
            }
          />
          <circle cx="18.5" cy="23.5" r="1.15" fill="#ffffff" />

          {/* BULB B: Roommate Node Right (Illuminated gas bulb with harmonious phase-delayed pulse) */}
          <motion.circle
            cx="29.5"
            cy="23.5"
            r="2.6"
            fill={`url(#${beaconGradId}-t)`}
            stroke="#5eead4"
            strokeWidth="0.8"
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 1 }
                : {
                    scale: [1, 1.16, 1],
                    opacity: [0.92, 1, 0.92]
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: 2.7,
                    delay: 0.45,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
            }
          />
          <circle cx="29.5" cy="23.5" r="1.15" fill="#ffffff" />

          {/* BULB C: Warm Attic Window / Location Beacon (Top center) */}
          <circle
            cx="24"
            cy="14"
            r="3.4"
            stroke={`url(#${tealGradId}-t)`}
            strokeWidth="2.0"
            fill="#060e16"
          />
          <circle
            cx="24"
            cy="14"
            r="3.4"
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.85"
            fill="none"
          />
          <motion.circle
            cx="24"
            cy="14"
            r="1.6"
            fill="#ffffff"
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: [0.85, 1, 0.85],
                    scale: [0.95, 1.12, 0.95]
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
            }
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedRoomoraLogo;
