const fs = require("fs");
const path = require("path");

const newVersion = `2.0.${Date.now()}`;
const versionData = {
  version: newVersion,
  builtAt: new Date().toISOString(),
  timestamp: Date.now(),
};

// 1. Write to public/version.json
const publicDir = path.resolve(__dirname, "../public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const publicVersionPath = path.join(publicDir, "version.json");
fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2), "utf8");
console.log(`📦 [Version Generator] تم إنشاء ملف الإصدار في public/version.json: ${newVersion}`);

// 2. Also write to out/version.json if out exists
const outDir = path.resolve(__dirname, "../out");
if (fs.existsSync(outDir)) {
  fs.writeFileSync(path.join(outDir, "version.json"), JSON.stringify(versionData, null, 2), "utf8");
}
