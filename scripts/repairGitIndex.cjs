const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const indexPath = path.join(__dirname, "..", ".git", "index");
const lockPath = path.join(__dirname, "..", ".git", "index.lock");

console.log("🔍 فحص سلامة فهرس Git (.git/index)...");

try {
  // 1. إزالة أي قفل معلق (stale lock file)
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log("🧹 تم إزالة ملف القفل المعلق (.git/index.lock).");
  }

  // 2. فحص حجم ملف الفهرس
  let isCorrupted = false;
  if (fs.existsSync(indexPath)) {
    const stats = fs.statSync(indexPath);
    if (stats.size < 12) {
      isCorrupted = true;
      console.warn(
        `⚠️ حجم ملف الفهرس (${stats.size} bytes) أصغر من المتوقع ومصاب بالتلف.`,
      );
    } else {
      try {
        execSync("git status --porcelain", { stdio: "pipe" });
      } catch (e) {
        isCorrupted = true;
        console.warn("⚠️ فشل قراءة الفهرس بواسطة git status.");
      }
    }
  } else {
    isCorrupted = true;
  }

  // 3. إصلاح الفهرس
  if (isCorrupted) {
    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath);
    }
    execSync("git reset", { stdio: "inherit" });
    console.log(
      "✅ تم إصلاح وإعادة بناء فهرس Git بنجاح تام بدون المساس بأي كود.",
    );
  } else {
    console.log("✅ فهرس Git سليم ولا توجد به أي مشكلة.");
  }
} catch (error) {
  console.error("❌ حدث خطأ أثناء فحص/إصلاح الفهرس:", error.message);
}
