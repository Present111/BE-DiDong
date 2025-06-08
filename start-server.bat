@echo off
setlocal

:: === ĐƯỜNG DẪN NGROK VÀ THƯ MỤC DỰ ÁN ===
set NGROK_EXE="D:\Download\ngrok-v3-stable-windows-amd64\ngrok.exe"
set AUTHTOKEN=2wu8loX564tCit5u1joeB9J0vMe_zt852vMDNsaDdeHFj4dR
set DOMAIN=tough-relaxed-newt.ngrok-free.app
set BASEDIR=%~dp0

echo 🚀 Đang mở 2 tab Windows Terminal...

start wt -w 0 ^
    new-tab cmd /k "echo 🌐 Ngrok starting... && cd /d %BASEDIR% && %NGROK_EXE% http 3000 --domain=%DOMAIN% --authtoken=%AUTHTOKEN%" ^
    ; new-tab cmd /k "echo 🧠 Starting Node.js server... && cd /d %BASEDIR% && node index.js"
