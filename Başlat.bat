@echo off
chcp 65001 >nul
title KARANLIK BOGAZ - Yerel Sunucu
cd /d "%~dp0"

echo.
echo   ==========================================
echo      K A R A N L I K   B O G A Z
echo   ==========================================
echo.
echo   Oyun yerel sunucuya aliniyor,
echo   tarayicida otomatik acilacak...
echo.

where node >nul 2>nul
if errorlevel 1 goto TRY_PS

rem Node gercekten calisiyor mu? (bozuk kurulum / Store kisayolu olabilir)
node -e "process.exit(0)" >nul 2>nul
if errorlevel 1 goto TRY_PS
goto NODE

:TRY_PS
where powershell >nul 2>nul
if errorlevel 1 goto FILE
goto PS

:NODE
node "%~dp0sunucu.js"
goto END

:PS
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sunucu.ps1"
goto END

:FILE
echo   Node.js ve PowerShell bulunamadi.
echo   Oyun dosyadan aciliyor: index.html
start "" "%~dp0index.html"
goto END

:END
echo.
echo   Sunucu kapandi.
echo   (Pencereyi kapatabilirsin. Bir hata varsa yukarida yaziyordur.)
pause >nul
