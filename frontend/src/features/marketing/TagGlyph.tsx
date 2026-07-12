// A fixed, hand-set 7x7 pattern standing in for a QR code on the hero's
// mock asset tag - decorative, not scannable, deterministic (no generative
// randomness needed for something this small).
const PATTERN = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [0, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
];

export function TagGlyph({ className }: { className?: string }) {
  return (
    <div className={`grid grid-cols-7 gap-[2px] ${className ?? ""}`} aria-hidden="true">
      {PATTERN.flatMap((row, y) =>
        row.map((cell, x) => (
          <span
            key={`${y}-${x}`}
            className={cell ? "aspect-square rounded-[1px] bg-current" : "aspect-square"}
          />
        ))
      )}
    </div>
  );
}
