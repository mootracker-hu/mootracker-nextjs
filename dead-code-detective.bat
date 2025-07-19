@echo off
echo ===================================================
echo 🕵️‍♂️ MOOTRACKER TELJES PROJEKT DEAD CODE DETECTIVE
echo ===================================================
echo.
echo ⚠️  100%% BIZTONSÁGOS - CSAK ELEMEZ, NEM VÁLTOZTAT! ⚠️
echo.

cd /d C:\Users\jakus\mootracker-nextjs

:: Létrehozzuk a reports mappát
mkdir reports 2>nul
cd reports

echo [1/8] 📁 TELJES FÁJL INVENTORY...
echo Összes TypeScript/JavaScript fájl listázása...
dir /S /B ..\src\*.tsx ..\src\*.ts ..\src\*.jsx ..\src\*.js > all-files.txt 2>nul
for /f %%i in ('type all-files.txt ^| find /c /v ""') do echo    ✅ Talált fájlok: %%i
echo.

echo [2/8] 🗑️ KOMMENTELT KÓDOK KERESÉSE...
echo Kommentelt importok, exportok, függvények...
findstr /S /N "^[ ]*//.*import\|^[ ]*//.*export\|^[ ]*//.*const\|^[ ]*//.*function\|^[ ]*//.*interface" ..\src\*.tsx ..\src\*.ts > commented-code.txt 2>nul
for /f %%i in ('type commented-code.txt ^| find /c /v ""') do echo    🔍 Kommentelt kódok: %%i sor
echo.

echo [3/8] 📦 HASZNÁLATLAN FÁJLOK KERESÉSE...
echo Fájlok amik nincsenek importálva sehol...
echo Keresés: import statements összes fájlban...
findstr /S /N "^import.*from.*['\"]" ..\src\*.tsx ..\src\*.ts > all-imports.txt 2>nul
echo Keresés: require statements...
findstr /S /N "require.*['\"]" ..\src\*.tsx ..\src\*.ts >> all-imports.txt 2>nul
for /f %%i in ('type all-imports.txt ^| find /c /v ""') do echo    📥 Import statements: %%i
echo.

echo [4/8] 🧪 TESZT FÁJLOK AZONOSÍTÁSA...
echo .test., .spec., .stories. fájlok...
dir /S /B ..\src\*.test.* ..\src\*.spec.* ..\src\*.stories.* > test-files.txt 2>nul
for /f %%i in ('type test-files.txt ^| find /c /v ""') do echo    🧪 Teszt fájlok: %%i
echo.

echo [5/8] 📊 BACKUP ÉS TEMP FÁJLOK...
echo .backup, .bak, .tmp, .old fájlok...
dir /S /B ..\src\*.backup ..\src\*.bak ..\src\*.tmp ..\src\*.old > backup-files.txt 2>nul
for /f %%i in ('type backup-files.txt ^| find /c /v ""') do echo    💾 Backup fájlok: %%i
echo.

echo [6/8] 🔍 HASZNÁLATLAN STATE VÁLTOZÓK...
echo useState-ek amik nem használódnak...
findstr /S /N "useState" ..\src\*.tsx | findstr /V "set.*(" > potential-unused-state.txt 2>nul
for /f %%i in ('type potential-unused-state.txt ^| find /c /v ""') do echo    🎯 Potenciális unused state: %%i
echo.

echo [7/8] 📝 EMPTY/MINIMAL FÁJLOK...
echo Túl kicsi fájlok (valószínűleg üresek vagy félkészek)...
for /f "delims=" %%f in ('dir /S /B ..\src\*.tsx ..\src\*.ts') do (
    for %%s in ("%%f") do (
        if %%~zs LSS 500 (
            echo %%f - %%~zs bytes >> small-files.txt
        )
    )
)
if exist small-files.txt (
    for /f %%i in ('type small-files.txt ^| find /c /v ""') do echo    📄 Kicsi fájlok ^(^<500 byte^): %%i
) else (
    echo    📄 Kicsi fájlok: 0
)
echo.

echo [8/8] 🎭 CONSOLE.LOG ÉS DEBUG KÓDOK...
echo console.log, debugger, TODO megjegyzések...
findstr /S /N "console\.log\|console\.error\|debugger\|TODO\|FIXME\|HACK" ..\src\*.tsx ..\src\*.ts > debug-code.txt 2>nul
for /f %%i in ('type debug-code.txt ^| find /c /v ""') do echo    🐛 Debug/TODO kódok: %%i
echo.

echo ===================================================
echo 📋 DEAD CODE DETECTIVE JELENTÉS ELKÉSZÜLT!
echo ===================================================
echo.
echo 📁 Minden jelentés itt: %CD%
echo.
echo 📄 FÁJLOK:
echo    • all-files.txt           - Összes forrásfájl
echo    • commented-code.txt      - Kommentelt kódok  
echo    • all-imports.txt         - Összes import
echo    • test-files.txt          - Teszt fájlok
echo    • backup-files.txt        - Backup fájlok
echo    • potential-unused-state.txt - Unused useState-ek
echo    • small-files.txt         - Túl kicsi fájlok
echo    • debug-code.txt          - Debug/TODO kódok
echo.

echo 🎯 KÖVETKEZŐ LÉPÉSEK:
echo 1. Nézzük át együtt a jelentéseket
echo 2. Azonosítsuk a biztosan törölhető fájlokat
echo 3. Takarítsuk meg a projektet!
echo.

echo 💡 TIPP: Nyisd meg a reports mappát a Fájlkezelőben:
echo    %CD%
echo.

echo ===================================================
echo 🏁 DETECTIVE MUNKA BEFEJEZVE - SEMMI NEM VÁLTOZOTT!
echo ===================================================
pause