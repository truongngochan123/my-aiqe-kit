<#
.SYNOPSIS
  Tạo thư mục cho một dự án mới, kèm .aiqe/project.aiqe.yml điền sẵn tên, URL, module, ngôn ngữ.

.DESCRIPTION
  Lớp vỏ PowerShell cho new-project.js. Field không truyền vào giữ mặc định CHẶT NHẤT
  (ai_policy: UNKNOWN ...). Không ghi đè nếu file đã có. In nội dung ra để kiểm tra.

.EXAMPLE
  .\scripts\project\new-project.ps1 -Name aiqe-pilot -Url https://opensource-demo.orangehrmlive.com -Modules LOGIN,PIM -Parent D:\fpt-inform
.EXAMPLE
  .\scripts\project\new-project.ps1 -Name du-an-x -Url https://qa-sandbox.example.com -Lang en -OutputOutside

  Mặc định output nằm ở <dự án>\.aiqe\output và ".aiqe/" được thêm vào .git/info/exclude (nếu đã là repo git).
  -OutputOutside: dự án yêu cầu để output ngoài repo → ~/aiqe-output/<tên>.
  -OutputInProject: giữ lại để lệnh cũ không lỗi; nay là mặc định.
#>
param(
  [Parameter(Mandatory = $true)] [string] $Name,
  [Parameter(Mandatory = $true)] [string] $Url,
  [string[]] $Modules,
  [ValidateSet('vi', 'en')] [string] $Lang = 'vi',
  [string] $Parent = (Get-Location).Path,
  [switch] $OutputOutside,
  [switch] $OutputInProject
)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'Cần Node.js (>= 18). Cài tại https://nodejs.org rồi chạy lại.'
  exit 1
}

$argsList = @("$PSScriptRoot\new-project.js", '--name', $Name, '--url', $Url, '--lang', $Lang, '--parent', $Parent)
if ($Modules) { $argsList += @('--modules', ($Modules -join ',')) }
if ($OutputOutside) { $argsList += '--output-outside' }

& node @argsList
exit $LASTEXITCODE
