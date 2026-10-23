import React, { useState, useMemo } from 'react';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  seed?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  alt?: string;
  shape?: 'circle' | 'rounded' | 'square';
  showBorder?: boolean;
}

// Curated modern gradient themes (vibrant yet refined, high accessibility contrast)
const AVATAR_PALETTES = [
  { bg: 'from-teal-500 to-emerald-600', text: 'text-white', border: 'border-teal-400/40' },
  { bg: 'from-violet-600 to-indigo-700', text: 'text-white', border: 'border-indigo-400/40' },
  { bg: 'from-cyan-500 to-blue-600', text: 'text-white', border: 'border-cyan-400/40' },
  { bg: 'from-rose-500 to-pink-600', text: 'text-white', border: 'border-rose-400/40' },
  { bg: 'from-amber-500 to-orange-600', text: 'text-slate-950', border: 'border-amber-400/40' },
  { bg: 'from-fuchsia-500 to-purple-600', text: 'text-white', border: 'border-fuchsia-400/40' },
  { bg: 'from-emerald-500 to-teal-700', text: 'text-white', border: 'border-emerald-400/40' },
  { bg: 'from-sky-500 to-indigo-600', text: 'text-white', border: 'border-sky-400/40' },
];

/**
 * Returns deterministic initials from a name (max 2 letters).
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministically pick an avatar palette based on a stable seed string.
 * Uses a simple polynomial hash so it renders the exact same gradient across refreshes.
 */
export function getPalette(seed?: string | null) {
  if (!seed) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Generates an SVG data URI for modern deterministic avatar (ideal for email templates
 * or static image requirements where React components cannot be mounted).
 */
export function generateModernAvatarDataUri(name?: string | null, seed?: string | null): string {
  const initials = getInitials(name);
  const palette = getPalette(seed || name);
  
  // Pick background colors based on palette
  const colors: Record<string, [string, string]> = {
    'from-teal-500 to-emerald-600': ['#14b8a6', '#059669'],
    'from-violet-600 to-indigo-700': ['#7c3aed', '#4338ca'],
    'from-cyan-500 to-blue-600': ['#06b6d4', '#2563eb'],
    'from-rose-500 to-pink-600': ['#f43f5e', '#db2777'],
    'from-amber-500 to-orange-600': ['#f59e0b', '#ea580c'],
    'from-fuchsia-500 to-purple-600': ['#d946ef', '#9333ea'],
    'from-emerald-500 to-teal-700': ['#10b981', '#0f766e'],
    'from-sky-500 to-indigo-600': ['#0ea5e9', '#4f46e5'],
  };
  const [col1, col2] = colors[palette.bg] || ['#14b8a6', '#059669'];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${col1}"/>
        <stop offset="100%" stop-color="${col2}"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#grad)"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="44" letter-spacing="1">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Filter out legacy cartoon DiceBear avatars so they are automatically upgraded to modern avatars.
 */
function isLegacyCartoonAvatar(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('dicebear.com') && (url.includes('avataaars') || url.includes('bottts') || url.includes('pixel-art'));
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  seed,
  size = 'md',
  className = '',
  alt = 'Avatar',
  shape = 'rounded',
  showBorder = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Parse palette-token OR legacy cartoon → force gradient fallback
  const paletteTokenSeed = useMemo(() => {
    if (src && src.startsWith('__palette:')) return src.slice('__palette:'.length);
    return null;
  }, [src]);

  const validSrc = useMemo(() => {
    if (!src || imgFailed || isLegacyCartoonAvatar(src) || paletteTokenSeed) return null;
    return src;
  }, [src, imgFailed, paletteTokenSeed]);

  const initials = useMemo(() => getInitials(name), [name]);
  // If user picked a palette token, use that seed; otherwise fall back to user seed/name
  const palette = useMemo(() => getPalette(paletteTokenSeed ?? seed ?? name), [paletteTokenSeed, seed, name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    full: 'w-full h-full text-2xl',
  }[size];

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-2xl',
    square: 'rounded-lg',
  }[shape];

  const borderClass = showBorder ? `border-2 ${palette.border}` : '';

  if (validSrc) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 ${shapeClasses} ${sizeClasses} ${borderClass} ${className}`}
      >
        <img
          src={validSrc}
          alt={alt}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
        />
      </div>
    );
  }

  // Modern abstract geometric initials fallback
  return (
    <div
      aria-label={alt || name || 'User avatar'}
      role="img"
      className={`relative shrink-0 flex items-center justify-center font-extrabold tracking-wider bg-gradient-to-tr ${palette.bg} ${palette.text} select-none shadow-xs ${shapeClasses} ${sizeClasses} ${borderClass} ${className}`}
    >
      {/* Subtle modern geometric ring overlay for high-end look */}
      <div className="absolute inset-0 bg-white/10 opacity-40 mix-blend-overlay pointer-events-none rounded-[inherit]" />
      <span className="relative z-10 leading-none drop-shadow-xs font-mono">{initials}</span>
    </div>
  );
};
