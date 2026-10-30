@echo off
rem Puts a "Doll Accessories Studio" shortcut on the Desktop and in the Start menu. Safe to run again.
setlocal
set "HERE=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {" ^
  "  $s = $ws.CreateShortcut((Join-Path $dir 'Doll Accessories Studio.lnk'));" ^
  "  $s.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe';" ^
  "  $s.Arguments = '\"' + (Join-Path $env:HERE 'Doll Accessories Studio.vbs') + '\"';" ^
  "  $s.IconLocation = (Join-Path $env:HERE 'app.ico') + ',0';" ^
  "  $s.WorkingDirectory = $env:HERE;" ^
  "  $s.Save() }"
echo Doll Accessories Studio shortcut added to the Desktop and Start menu.
