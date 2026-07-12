interface LogoProps {
  className?: string;
  markOnly?: boolean;
}

// The mark is the same tag glyph used for the Assets nav icon - the product
// is, at its core, a tag attached to a thing. One shape, reused everywhere.
export function Logo({ className, markOnly }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true">
        <path
          d="M10.6 3.2 16.8 9.4a1.4 1.4 0 0 1 0 2L10.4 17.8a1.4 1.4 0 0 1-2 0L2.6 12a1.4 1.4 0 0 1-.4-1V4.6A1.4 1.4 0 0 1 3.6 3.2H10a1.4 1.4 0 0 1 .6 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6.6" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      {!markOnly && (
        <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-white">
          AssetFlow
        </span>
      )}
    </span>
  );
}
