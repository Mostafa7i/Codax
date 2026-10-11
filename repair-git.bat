@echo off
chcp 65001 >nul
echo [CodaxApp] جاري فحص وإصلاح فهرس Git...
node scripts\repairGitIndex.cjs
echo.
pause

