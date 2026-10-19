# ============================================================
#  KARANLIK BOGAZ - local server (PowerShell version)
#  Used by Baslat.bat when Node.js is not installed.
#  Requires only PowerShell (comes with Windows).
#  Listens on 127.0.0.1 only, so no admin rights are needed.
#  NOTE: this file is intentionally ASCII-only for safe parsing.
# ============================================================

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Ports = @(8000, 8080, 8090, 8123, 8765)

$Mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.htm'   = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'text/javascript; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.md'    = 'text/plain; charset=utf-8'
  '.txt'   = 'text/plain; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.gif'   = 'image/gif'
  '.webp'  = 'image/webp'
  '.ico'   = 'image/x-icon'
  '.mp3'   = 'audio/mpeg'
  '.ogg'   = 'audio/ogg'
  '.wav'   = 'audio/wav'
  '.woff'  = 'font/woff'
  '.woff2' = 'font/woff2'
}

function Get-Mime([string]$file) {
  $ext = [System.IO.Path]::GetExtension($file).ToLower()
  if ($Mime.ContainsKey($ext)) { return $Mime[$ext] }
  return 'application/octet-stream'
}

# ---------- find a free port ----------
$listener = $null
$port = 0
foreach ($p in $Ports) {
  try {
    $l = New-Object -TypeName System.Net.Sockets.TcpListener -ArgumentList @([System.Net.IPAddress]::Loopback, $p)
    $l.Start()
    $listener = $l
    $port = $p
    break
  } catch { }
}

if ($listener -eq $null) {
  Write-Host ''
  Write-Host '  HATA: Bos port bulunamadi (8000-8765 dolu).' -ForegroundColor Red
  Write-Host '  Acik baska bir sunucuyu kapatip tekrar dene.'
  Read-Host '  Kapatmak icin Enter'
  exit 1
}

$url = 'http://localhost:' + $port + '/'

Write-Host ''
Write-Host '  ==============================================' -ForegroundColor DarkYellow
Write-Host '             K A R A N L I K   B O G A Z        ' -ForegroundColor Yellow
Write-Host '  ==============================================' -ForegroundColor DarkYellow
Write-Host ''
Write-Host ('  Oyun adresi :  ' + $url) -ForegroundColor Cyan
Write-Host ('  Klasor      :  ' + $Root)
Write-Host ''
Write-Host '  Tarayici acilmazsa adresi elle ac.'
Write-Host '  Sunucuyu durdurmak icin bu pencereyi kapat.'
Write-Host ''

# ---------- open browser (Chrome first) ----------
$chrome = $null
try {
  $candidates = @()
  if ($env:ProgramFiles)        { $candidates += (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe') }
  if (${env:ProgramFiles(x86)}) { $candidates += (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe') }
  if ($env:LOCALAPPDATA)        { $candidates += (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe') }
  $chrome = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
} catch { $chrome = $null }

try {
  if ($chrome) {
    Start-Process -FilePath $chrome -ArgumentList '--new-window', $url | Out-Null
  } else {
    Start-Process $url | Out-Null
  }
} catch {
  Write-Host '  (Tarayici otomatik acilamadi, adresi elle ac.)'
}

# ---------- serve ----------
$rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'

while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $stream.ReadTimeout = 1500

    $reader = New-Object -TypeName System.IO.StreamReader -ArgumentList @($stream, [System.Text.Encoding]::ASCII)
    $first = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($first)) { $client.Close(); continue }

    # read headers until blank line
    while ($true) {
      $line = $reader.ReadLine()
      if ($line -eq $null -or $line -eq '') { break }
    }

    $parts = $first.Split(' ')
    $rawPath = '/'
    if ($parts.Length -ge 2) { $rawPath = $parts[1] }
    $rawPath = $rawPath.Split('?')[0]

    $rel = ''
    try { $rel = [System.Uri]::UnescapeDataString($rawPath) } catch { $rel = $rawPath }
    $rel = $rel.Replace('/', '\')
    $rel = $rel.TrimStart('\')
    if ($rel -eq '') { $rel = 'index.html' }

    $status = '200 OK'
    $ctype = 'text/plain; charset=utf-8'
    $body = $null

    $full = ''
    try {
      $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    } catch {
      $full = ''
    }

    if ($full -eq '' -or -not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      $status = '403 Forbidden'
      $body = [System.Text.Encoding]::UTF8.GetBytes('Bu klasorun disina cikilamaz.')
    } elseif (Test-Path -LiteralPath $full -PathType Container) {
      $idx = Join-Path $full 'index.html'
      if (Test-Path -LiteralPath $idx) {
        $ctype = 'text/html; charset=utf-8'
        $body = [System.IO.File]::ReadAllBytes($idx)
      } else {
        $status = '403 Forbidden'
        $body = [System.Text.Encoding]::UTF8.GetBytes('Klasor listesi kapali.')
      }
    } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
      $ctype = Get-Mime $full
      $body = [System.IO.File]::ReadAllBytes($full)
    } else {
      $status = '404 Not Found'
      $ctype = 'text/html; charset=utf-8'
      $html = '<!doctype html><meta charset="utf-8"><title>404</title>' +
              '<body style="background:#0b0f14;color:#cfd6dd;font-family:system-ui;padding:48px">' +
              '<h1 style="color:#d8453e">404 - bulunamadi</h1>' +
              '<p><a style="color:#e8b46a" href="/">Oyuna don</a></p>'
      $body = [System.Text.Encoding]::UTF8.GetBytes($html)
    }

    $head = 'HTTP/1.1 ' + $status + "`r`n" +
            'Content-Type: ' + $ctype + "`r`n" +
            'Content-Length: ' + $body.Length + "`r`n" +
            "Cache-Control: no-store, no-cache, must-revalidate`r`n" +
            "Connection: close`r`n`r`n"
    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($headBytes, 0, $headBytes.Length)
    if ($body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
    $stream.Flush()
    $client.Close()
  } catch {
    try { if ($client -ne $null) { $client.Close() } } catch { }
  }
}
