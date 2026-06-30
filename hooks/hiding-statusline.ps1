$flag = "$env:CLAUDE_CONFIG_DIR\.hiding-active"
if (-not $env:CLAUDE_CONFIG_DIR) { $flag = "$env:USERPROFILE\.claude\.hiding-active" }
if (-not (Test-Path $flag)) { exit 0 }

Write-Host -NoNewline -ForegroundColor Green "[HIDING]"
