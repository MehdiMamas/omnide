// Maps every Cursor-era colour in a v2 screen to the nearest OmnIDE token (by CIE L*), alpha kept.
import fs from "fs";
const T = JSON.parse(fs.readFileSync(new URL("../tokens.json", import.meta.url), "utf8"));
const hex2rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const Y = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const Ls = (rgb) => { const y = Y(rgb); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };
const toHex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l]; };
const ramps = {
  dark: Object.values(T.dark).map((v) => hex2rgb(v[0])),
  light: Object.values(T.light).map((v) => hex2rgb(v[0])),
};
ramps.any = [...ramps.dark, ...ramps.light];
const acc = Object.values(T.accent).map((v) => hex2rgb(v[0]));
const nearest = (list, rgb) => { const L = Ls(rgb); let best = list[0], bd = 1e9; for (const c of list) { const d = Math.abs(Ls(c) - L); if (d < bd) { bd = d; best = c; } } return best; };
export function mapRGB(rgb, theme = "any") {
  const [h, s] = hsl(rgb), sp = Math.max(...rgb) - Math.min(...rgb);
  if (sp <= 24 || s < 0.18) return nearest(ramps[theme], rgb);       // neutral -> purple-tinted neutral
  if (h >= 190 && h <= 300 && s >= 0.2) return nearest(acc, rgb);    // blue or purple -> accent ramp
  return rgb;                                                          // green, red, orange, yellow stay (status and syntax)
}
const num = (x) => (x.endsWith("%") ? parseFloat(x) * 2.55 : parseFloat(x));
export function mapColors(s, theme = "any") {
  s = s.replace(/(?<![\w&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g, (m, h, off, str) => {
    if (h.length === 3 && !/[:\s,(]/.test(str[off - 1] || "") ) return m;
    if (h.length === 3 && /[{]/.test(str[off + m.length] || "")) return m;
    const rgb = mapRGB(hex2rgb(h.slice(0, h.length === 8 ? 6 : h.length)), theme);
    return toHex(rgb) + (h.length === 8 ? h.slice(6) : "");
  });
  s = s.replace(/%23([0-9a-fA-F]{6})(?![0-9a-zA-Z])/g, (m, h) => "%23" + toHex(mapRGB(hex2rgb(h), theme)).slice(1));
  s = s.replace(/rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/g, (m, r, g, b, a) => {
    const [R, G, B] = mapRGB([+r, +g, +b], theme);
    return a === undefined ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${a})`;
  });
  s = s.replace(/hsla?\(\s*(-?[\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)/g, (m, h, sa, l, a) => {
    if (+sa > 18) return m;
    const v = Math.round(+l * 2.55), [R, G, B] = mapRGB([v, v, v], theme);
    return a === undefined ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${a})`;
  });
  return s;
}
export { T, hex2rgb, Ls, Y };
export const contrast = (a, b) => { const [x, y] = [Y(hex2rgb(a)), Y(hex2rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
