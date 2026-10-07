<#
.SYNOPSIS
  Tạo thư mục cho một dự án mới, kèm .aiqe/project.aiqe.yml điền sẵn tên, URL, module, ngôn ngữ.

.DESCRIPTION
  Lớp vỏ PowerShell cho new-project.js. Field không truyền vào giữ mặc định CHẶT NHẤT
  (ai_policy: UNKNOWN ...). Không ghi đè nếu file đã có. In nội dung ra để kiểm tra.

.EXAMPLE
  .\scripts\project\new-project.ps1 -Name aiqe-pilot -Url https://opensource-demo.orangehrmlive.com -Modules LOGIN,PIM -Parent D:\fpt-inform
.EXAMPLE
  .\scripts\project\new-project.ps1 -Name du-an-x -Url https://qa-sandbox.example.com -Lang en -OutputInProject
#>
param(
  [Parameter(Mandatory = $true)] [string] $Name,
  [Parameter(Mandatory = $true)] [string] $Url,
  [string[]] $Modules,
  [ValidateSet('vi', 'en')] [string] $Lang = 'vi',
  [string] $Parent = (Get-Location).Path,
  [switch] $OutputInProject
)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'Cần Node.js (>= 18). Cài tại https://nodejs.org rồi chạy lại.'
  exit 1
}

$argsList = @("$PSScriptRoot\new-project.js", '--name', $Name, '--url', $Url, '--lang', $Lang, '--parent', $Parent)
if ($Modules) { $argsList += @('--modules', ($Modules -join ',')) }
if ($OutputInProject) { $argsList += '--output-in-project' }

& node @argsList
exit $LASTEXITCODE
