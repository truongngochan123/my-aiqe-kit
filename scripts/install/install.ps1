<#
.SYNOPSIS
  Cài, gỡ hoặc kiểm tra my-aiqe-kit cho Codex và Claude Code.

.DESCRIPTION
  Lớp vỏ PowerShell cho install.js (logic nằm trong install.js vì ghép JSON/TOML bằng Node an toàn hơn).
  Mặc định cài ở CẤP USER: ~/.aiqe/kit/<version>/ (bản dùng thật), ~/.codex/, ~/.agents/skills/, ~/.claude/.
  Không ghi đè file của bạn: chỉ chèn/ghép phần của kit và backup trước vào ~/.aiqe/backup/.

.EXAMPLE
  .\install.ps1                       # cài cho Codex và Claude
  .\install.ps1 -Tool codex           # chỉ Codex
  .\install.ps1 -DryRun               # xem sẽ làm gì, không ghi file
  .\install.ps1 -Verify               # kiểm tra bản cài khớp snapshot
  .\install.ps1 -Uninstall            # gỡ phần của kit, giữ backup
  .\install.ps1 -Project D:\repo-x    # đặt skill/AGENTS.md trong một repo (ghi vào .git/info/exclude)
  .\install.ps1 -HomeDir D:\tmp\fake  # cài thử vào thư mục giả
#>
param(
  [ValidateSet('all', 'codex', 'claude', 'gemini')] [string] $Tool = 'all',
  [string] $Project,
  [string] $HomeDir,
  [switch] $Uninstall,
  [switch] $Verify,
  [switch] $DryRun
)

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error 'Cần Node.js (>= 18). Cài tại https://nodejs.org rồi chạy lại.'
  exit 1
}

$argsList = @("$PSScriptRoot\install.js", '--tool', $Tool)
if ($Project)   { $argsList += @('--project', $Project) }
if ($HomeDir)   { $argsList += @('--home', $HomeDir) }
if ($Uninstall) { $argsList += '--uninstall' }
if ($Verify)    { $argsList += '--verify' }
if ($DryRun)    { $argsList += '--dry-run' }

& node @argsList
exit $LASTEXITCODE
