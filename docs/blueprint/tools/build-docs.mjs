import a from "./docs-agent.mjs"; import d from "./docs-design.mjs"; import pl from "./docs-plan.mjs"; import pp from "./docs-play.mjs";
import { writeFileSync } from "node:fs";
const all=[...a,...d,...pl,...pp];
writeFileSync(new URL("../tools/docs-built.json",import.meta.url),JSON.stringify(all,null,1));
console.log(all.map(x=>x.file).join("\n"));
