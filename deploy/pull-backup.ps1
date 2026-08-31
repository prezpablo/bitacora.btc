# Copia el SQLite del VPS a este PC (fuera del server).
# PowerShell:  powershell -File deploy\pull-backup.ps1
$dir = Join-Path $HOME "Documents\bitacora-backups"
New-Item -ItemType Directory -Force $dir | Out-Null
scp bitacora@45.158.116.49:/var/backups/bitacora/*.sqlite.gz $dir
Get-ChildItem $dir | Sort-Object LastWriteTime -Descending | Select-Object -First 5 Name, Length, LastWriteTime
