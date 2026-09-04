export interface AppLogoProps {
  /** Size / dimension of the icon in pixels or preset */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show the text to the right of the icon */
  showText?: boolean;
  /** Optional custom CSS classes */
  className?: string;
  /** Whether to animate on hover */
  animated?: boolean;
  /** Layout orientation: 'horizontal' (default) or 'vertical' */
  layout?: 'horizontal' | 'vertical';
}

export function AppLogo({
  size = 'md',
  showText = false,
  className = '',
  animated = false,
  layout = 'horizontal',
}: AppLogoProps) {
  const iconDim = typeof size === 'number'
    ? size
    : size === 'xs' ? 24
    : size === 'sm' ? 30
    : size === 'md' ? 44
    : size === 'lg' ? 52
    : 62; // 'xl'

  const fontSizeClass = iconDim <= 30
    ? 'text-lg'
    : iconDim <= 44
    ? 'text-2xl'
    : 'text-3xl';

  const isVertical = layout === 'vertical';

  return (
    <div
      className={`${
        isVertical ? 'inline-flex flex-col items-center gap-3' : 'inline-flex items-center gap-3.5'
      } select-none shrink-0 ${
        animated ? 'group cursor-pointer' : ''
      } ${className}`}
      title="EXPENSE-HUB"
    >
      {/* 1. STANDALONE LUXURY OBSIDIAN & NEON DIAMOND EMBLEM */}
      <div
        style={{ width: iconDim, height: iconDim }}
        className={`relative shrink-0 flex items-center justify-center rounded-2xl bg-[#091020]/90 border border-[#00F0FF]/40 shadow-[0_0_18px_rgba(0,240,255,0.35)] backdrop-blur-md p-1.5 overflow-hidden transition-all duration-300 ${
          animated ? 'group-hover:scale-105 group-hover:shadow-[0_0_26px_rgba(0,240,255,0.6)] active:scale-95' : ''
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Neon Cyan to Purple Gradient */}
            <linearGradient id="vaultNeonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#38E1D2" />
              <stop offset="100%" stopColor="#8A2BE2" />
            </linearGradient>

            {/* Core Chrome Highlight */}
            <linearGradient id="chromeHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Ambient Glow */}
            <filter id="vaultSoftGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hexagonal Tech Grid Accent */}
          <path
            d="M 50 16 L 82 34 V 66 L 50 84 L 18 66 V 34 Z"
            stroke="#1E293B"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />

          {/* Ambient Glow Underlay */}
          <g filter="url(#vaultSoftGlow)" opacity="0.65">
            <path
              d="M 50 14 L 86 50 L 50 86 L 14 50 Z"
              stroke="#00F0FF"
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>

          {/* Outer Prism Diamond Frame */}
          <path
            d="M 50 14 L 86 50 L 50 86 L 14 50 Z"
            stroke="url(#vaultNeonGradient)"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />

          {/* Inner Inset Diamond Track */}
          <path
            d="M 50 25 L 75 50 L 50 75 L 25 50 Z"
            stroke="#1E293B"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Core Metallic 'E' Monogram */}
          <path
            d="M 64 34 H 38 V 66 H 64 M 38 50 H 58"
            stroke="url(#chromeHighlight)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 64 34 H 38 V 66 H 64 M 38 50 H 58"
            stroke="url(#vaultNeonGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Specular Glint Star */}
          <circle cx="78" cy="22" r="1.5" fill="#FFFFFF" />
          <polygon
            points="78,17 79.5,21.5 84,22 79.5,22.5 78,27 76.5,22.5 72,22 76.5,21.5"
            fill="#00F0FF"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* 2. SEAMLESS NATIVE TYPOGRAPHY (NO BLACK ENCLOSING BOX) */}
      {showText && (
        <span className={`font-black ${fontSizeClass} tracking-tight leading-none text-gray-900 dark:text-white flex items-center`}>
          EXPENSE-<span className="text-[#00F0FF] dark:text-[#00F0FF] drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">HUB</span>
        </span>
      )}
    </div>
  );
}
