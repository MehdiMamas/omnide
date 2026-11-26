// OmnIDE mark, variant A chosen: ring with a prompt chevron (the other two are drawn on the Brand frame).
export const MARKS = {
  A: (ac) => `<circle cx="16" cy="16" r="13" fill="none" stroke="${ac}" stroke-width="3.2"/><path d="M12.5 10.8 18.8 16l-6.3 5.2" fill="none" stroke="${ac}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  B: (ac) => `<circle cx="16" cy="16" r="13" fill="none" stroke="${ac}" stroke-width="3.2"/><rect x="14.4" y="9" width="3.2" height="14" rx="1.6" fill="${ac}"/>`,
  C: (ac) => `<path d="M26.6 10.4A13 13 0 1 0 26.6 21.6" fill="none" stroke="${ac}" stroke-width="3.2" stroke-linecap="round"/><path d="M12.5 10.8 18.8 16l-6.3 5.2" fill="none" stroke="${ac}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
};
export const mark = (size, light, v = "A") => `<svg role="img" aria-label="OmnIDE mark" width="${size}" height="${size}" viewBox="0 0 32 32" style="display:inline-block;flex:none">${MARKS[v](light ? "#6D28D9" : "#B69CFF")}</svg>`;
// lockup keeps the old 124x30 box so layouts do not move
export const logo = (light, w = 124, h = 30) => {
  const ink = light ? "#1A1626" : "#F4F2FB", ac = light ? "#6D28D9" : "#B69CFF";
  return `<svg role="img" aria-label="OmnIDE logo" class="h-[30px]" width="${w}" height="${h}" viewBox="0 0 124 30" style="display:block"><g transform="translate(0 1) scale(.875)">${MARKS.A(ac)}</g><text x="34" y="21" font-family="Geist,system-ui,sans-serif" font-size="19" letter-spacing="-.3" fill="${ink}">Omn<tspan font-weight="700">IDE</tspan></text></svg>`;
};
