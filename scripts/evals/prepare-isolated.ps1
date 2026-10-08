<#
.SYNOPSIS
  Tạo một thư mục eval tạm, sạch, không chứa đáp án golden, để chạy một case eval.

.DESCRIPTION
  - Tạo thư mục mới trong %TEMP%\aiqe-eval\<tên> kèm .aiqe/project.aiqe.yml (dùng new-project.js, output nằm trong thư mục).
  - Chép các file đầu vào (-Inputs) vào thư mục đó.
  - Kiểm tra trong thư mục KHÔNG có evals/golden, practices/testcases hay file *golden*: AI làm bài không được thấy đáp án.
  Đây là lớp chống sai sót: AI vẫn đọc được file ở chỗ khác bằng đường dẫn tuyệt đối (docs/threat_model.md).

.EXAMPLE
  .\scripts\evals\prepare-isolated.ps1 -Name tdr-existing-01 -Url https://opensource-demo.orangehrmlive.com -Modules PIM
.EXAMPLE
  .\scripts\evals\prepare-isolated.ps1 -Name ra-p1 -Url http://localhost:3000 -Inputs D:\req\leave.md
#>
param(
  [Parameter(Mandatory = $true)] [string] $Name,
  [Parameter(Mandatory = $true)] [string] $Url,
  [string[]] $Modules,
  [string[]] $Inputs
)

$root = Join-Path $env:TEMP 'aiqe-eval'
New-Item -ItemType Directory -Force $root | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$evalName = "$Name-$stamp"
$kit = Resolve-Path (Join-Path $PSScriptRoot '..\..')

$argsList = @("$kit\scripts\project\new-project.js", '--name', $evalName, '--url', $Url, '--parent', $root)
if ($Modules) { $argsList += @('--modules', ($Modules -join ',')) }
& node @argsList | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error 'Tạo thư mục eval thất bại (xem new-project.js).'; exit 1 }

$dir = Join-Path $root $evalName
foreach ($f in $Inputs) {
  if (-not (Test-Path $f)) { Write-Error "Không có file đầu vào: $f"; exit 1 }
  Copy-Item $f $dir
}

$leak = Get-ChildItem $dir -Recurse -Force | Where-Object { $_.FullName -match 'golden|practices\\testcases' }
if ($leak) { Write-Error "Thư mục eval có file đáp án: $($leak.FullName -join ', ')"; exit 1 }

Write-Output "Thư mục eval: $dir"
Write-Output "Đầu vào đã chép: $(@($Inputs).Count) file. Không có file đáp án golden."
Write-Output "Tiếp theo: mở thư mục này trong VS Code, chat MỚI, dán prompt của case, rồi chấm:"
Write-Output "  node `"$kit\scripts\evals\grade.js`" `"$dir\.aiqe\output`" --expect <tên skill>"
Write-Output "Lưu ý: ai_policy trong .aiqe\project.aiqe.yml đang là UNKNOWN (mặc định chặt nhất); dữ liệu công khai thì có thể đổi thành allowed."
