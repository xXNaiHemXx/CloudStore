@echo off
title GitHub Auto Push

:loop
git add .
git commit -m "auto update"
git push

timeout /t 30 >nul
goto loop