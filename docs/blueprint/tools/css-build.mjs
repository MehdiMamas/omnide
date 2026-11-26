// Recolours and re-fonts the 8 shared Cursor CSS files into project/css/ (OmnIDE tokens + Geist).
import fs from "fs";
import { mapColors } from "./colors.mjs";
import { mapFonts } from "./fonts.mjs";
const SP = process.env.SCRATCH, OUT = "C:/Users/Mehdi/Projects/omnide/docs/blueprint/project/css/";
export const CSS = { "5491dcceb955a686ac8f61da7b97c05f": ["vendor-a", "any"], "9c82ff43968a37f6012d43e737d6f363": ["vendor-b", "any"], "4ce6dda63eb7635e7079f24cd25d4ba7": ["theme-dark", "dark"], "5a4fa4b5a0da87acd42b57a419bb9a80": ["theme-light", "light"], "9112db454c0c5f9d1f127afdcfb43892": ["term-1", "dark"], "794100b16b47390c1dd95ec6c9914e25": ["term-2", "dark"], "6eb0384cb609c6e93b936072349beaa5": ["term-3", "dark"], "1d527c6f23dc2d15a6413ad1e2215c27": ["term-light", "light"] };
if (process.argv[1].endsWith("css-build.mjs")) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [id, [name, theme]] of Object.entries(CSS)) {
    let s = fs.readFileSync(`${SP}/assets/${id}.css`, "utf8");
    s = mapFonts(mapColors(s, theme)).replace(/cursor\.com|cursor\.sh/g, "example.invalid");
    fs.writeFileSync(OUT + name + ".css", s);
    console.log(name, s.length);
  }
}
