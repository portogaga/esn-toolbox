// Next.js 16 : ne garder que proxy.ts — supprime middleware.ts s’il traîne (local ou ancien commit).
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "middleware.ts");
try {
  fs.unlinkSync(target);
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
