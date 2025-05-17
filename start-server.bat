@echo off
:: Lấy đường dẫn tuyệt đối của chính file .bat này
setlocal
set BASEDIR=%~dp0

echo 🚀 Đang mở 2 tab Windows Terminal...

start wt -w 0 ^
    new-tab cmd /k "echo 🌐 Ngrok starting... && cd /d %BASEDIR% && ngrok http 3000 --domain=tough-relaxed-newt.ngrok-free.app --authtoken=2wu8loX564tCit5u1joeB9J0vMe_zt852vMDNsaDdeHFj4dR" ^
    ; new-tab cmd /k "echo 🧠 Starting Node.js server... && cd /d %BASEDIR% && node index.js"





:: thế domain và authtoken
:: trong visual mở terminal chạy lệnh: 
:: .\start-server.bat