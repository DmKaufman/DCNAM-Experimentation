// Maps a temperature delta (rack reading minus hall baseline, in °F) to a
// blue → green → red hex color for the heatmap overlay.
export function tempToColor(deltaF) {
  const t = Math.min(1, Math.max(0, (deltaF + 2) / 16)); // -2°F..+14°F -> 0..1
  const hue = 220 - t * 220; // 220 (blue) -> 0 (red)
  return hslToHex(hue, 75, 50);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
