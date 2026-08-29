const fs = require("fs");
const path = require("path");

let JavaScriptObfuscator;
try {
  JavaScriptObfuscator = require("javascript-obfuscator");
} catch (e) {
  console.log(
    "⚠️ [Obfuscator] javascript-obfuscator غير مثبت، تم تخطي تشفير الكود.",
  );
  process.exit(0);
}

const configPath = path.resolve(__dirname, "../obfuscate.config.js");
let obfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayEncoding: [],
  stringArrayIndexShift: false,
  stringArrayWrappersCount: 1,
  stringArrayWrappersType: "variable",
  stringArrayThreshold: 0.5,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

if (fs.existsSync(configPath)) {
  try {
    const userConfig = require(configPath);
    obfuscationOptions = {
      ...userConfig,
      renameGlobals: false,
    };
  } catch (err) {
    console.warn("⚠️ خطأ في قراءة obfuscate.config.js:", err.message);
  }
}

const targetDir = path.resolve(__dirname, "../out/_next/static/chunks");

if (!fs.existsSync(targetDir)) {
  console.log("ℹ️ [Obfuscator] لم يتم العثور على مجلد chunks، سيتم التخطي.");
  process.exit(0);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".js") && !file.includes(".map")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

try {
  console.log(
    "🛡️ [Obfuscator] جارٍ تشفير ملفات JavaScript للتطبيق لحماية الكود المصدري...",
  );
  const jsFiles = getAllFiles(targetDir);
  let obfuscatedCount = 0;

  jsFiles.forEach((filePath) => {
    try {
      const stats = fs.statSync(filePath);
      const filename = path.basename(filePath);

      // تشفير كود التطبيق المخصص وتخطي المكتبات الضخمة الجاهزة لتسريع البناء
      const isFramework =
        filename.includes("framework") ||
        filename.includes("webpack") ||
        filename.includes("turbopack") ||
        stats.size > 250 * 1024; // > 250KB

      if (isFramework) {
        return;
      }

      const code = fs.readFileSync(filePath, "utf8");
      const obfuscationResult = JavaScriptObfuscator.obfuscate(
        code,
        obfuscationOptions,
      );
      fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode(), "utf8");
      obfuscatedCount++;
    } catch (err) {
      // Ignore individual file errors to ensure build never breaks
    }
  });

  console.log(
    `✅ [Obfuscator] تم تشفير ${obfuscatedCount} ملف كود مصدري بنجاح وبسرعة فائقة!`,
  );
} catch (e) {
  console.error("❌ خطأ عام أثناء التشفير:", e.message);
}
