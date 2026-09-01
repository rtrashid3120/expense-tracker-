import brandBannerImg from '../../logo/WhatsApp Image 2026-09-01 at 18.42.56.jpeg';

export interface AppLogoProps {
  /** Size of the logo icon in pixels */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show the text to the right of the logo */
  showText?: boolean;
  /** Use the exact uploaded banner directly */
  useBannerImage?: boolean;
  /** Optional custom CSS classes */
  className?: string;
  /** Whether to animate on hover */
  animated?: boolean;
}

export function AppLogo({
  size = 'md',
  showText = true,
  useBannerImage = false,
  className = '',
  animated = false,
}: AppLogoProps) {
  const iconDim = typeof size === 'number'
    ? size
    : size === 'xs' ? 26
    : size === 'sm' ? 32
    : size === 'md' ? 44
    : size === 'lg' ? 52
    : 62; // 'xl'

  const fontSizeClass = iconDim <= 32
    ? 'text-lg'
    : iconDim <= 44
    ? 'text-2xl'
    : 'text-3xl';

  // If useBannerImage is explicitly true, render the exact banner
  if (useBannerImage) {
    return (
      <div className={`inline-flex items-center select-none ${animated ? 'hover:scale-105 transition-transform' : ''} ${className}`}>
        <img
          src={brandBannerImg}
          alt="EXPENSE-HUB"
          style={{ height: iconDim }}
          className="w-auto object-contain rounded-xl"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3.5 select-none shrink-0 ${
        animated ? 'group cursor-pointer' : ''
      } ${className}`}
      title="EXPENSE-HUB"
    >
      {/* 1. EXACT "C" LOGO ICON FROM YOUR IMAGE */}
      <div
        style={{ width: iconDim, height: iconDim }}
        className={`relative shrink-0 flex items-center justify-center rounded-2xl bg-[#060C18] border border-[#38E1D2]/40 shadow-[0_0_18px_rgba(56,225,210,0.35)] overflow-hidden transition-transform duration-200 ${
          animated ? 'group-hover:scale-105 active:scale-95' : ''
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dark Blueprint Grid Pattern */}
          <path
            d="M 25 0 V 100 M 50 0 V 100 M 75 0 V 100 M 0 25 H 100 M 0 50 H 100 M 0 75 H 100"
            stroke="#0E1A2E"
            strokeWidth="0.75"
          />

          {/* Ambient Glow */}
          <g opacity="0.6">
            <path d="M 86 44 L 50 14 L 14 50 L 44 80" stroke="#38E1D2" strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" />
            <path d="M 54 90 L 86 58" stroke="#38E1D2" strokeWidth="9" strokeLinecap="square" />
            <path d="M 30 42 L 42 30" stroke="#38E1D2" strokeWidth="9" strokeLinecap="square" />
            <path d="M 48 34 L 68 54 L 48 74 L 30 56" stroke="#38E1D2" strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" />
          </g>

          {/* 1. Outer Top & Left Wall */}
          <path
            d="M 86 44 L 50 14 L 14 50 L 44 80"
            stroke="#38E1D2"
            strokeWidth="8.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* 2. Outer Bottom-Right Diagonal Arm */}
          <path
            d="M 54 90 L 86 58"
            stroke="#38E1D2"
            strokeWidth="8.5"
            strokeLinecap="square"
          />

          {/* 3. Inner Top-Left Floating Diagonal Bar */}
          <path
            d="M 30 42 L 42 30"
            stroke="#38E1D2"
            strokeWidth="8.5"
            strokeLinecap="square"
          />

          {/* 4. Inner Chevron Hook */}
          <path
            d="M 48 34 L 68 54 L 48 74 L 30 56"
            stroke="#38E1D2"
            strokeWidth="8.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {/* 2. TEXT WRITTEN TO THE RIGHT OF THE LOGO */}
      {showText && (
        <span className={`font-black ${fontSizeClass} tracking-tight text-[#38E1D2] drop-shadow-[0_0_12px_rgba(56,225,210,0.4)]`}>
          EXPENSE-HUB
        </span>
      )}
    </div>
  );
}
