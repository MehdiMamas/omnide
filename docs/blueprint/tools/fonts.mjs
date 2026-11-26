export const SANS = `Geist, system-ui, -apple-system, 'Segoe UI', sans-serif`;
export const MONO = `'Geist Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace`;
export const FACE = `@font-face{font-family:'Geist';src:url(./fonts/Geist-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}@font-face{font-family:'Geist Mono';src:url(./fonts/GeistMono-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}`;
const V = `(?:&quot;|[^;}"])*`;
export function mapFonts(s) {
  s = s.replace(new RegExp(`(font-family:\s*)(Consolas|'?&quot;?Consolas|"Consolas|'Courier New'|ui-monospace|"SF Mono"|"Ubuntu Mono")${V}`, "g"), (m, a) => a + MONO.replace(/'/g, "&quot;").replace(/&quot;/g, "'"));
  s = s.replace(new RegExp(`(font-family:\s*)(-apple-system|&quot;Segoe WPC|"Segoe WPC"|system-ui|"Segoe UI")${V}`, "g"), (m, a) => a + SANS);
  s = s.replace(/(--(?:vscode-font-family|cursor-font-family|cursor-font-family-sans)\s*:)[^;}"]*/g, `$1 ${SANS}`);
  s = s.replace(/(--(?:vscode-editor-font-family|monaco-monospace-font|cursor-font-family-mono|vscode-repl-font-family)\s*:)[^;}"]*/g, `$1 ${MONO}`);
  return s;
}
