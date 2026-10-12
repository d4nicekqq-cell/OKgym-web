# Local preview of dist/ with clean URLs (/cenik -> cenik.html): powershell -File serve.ps1 [port]
param([int]$Port = 5173)
$root = Join-Path $PSScriptRoot 'dist'
$types = @{ '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.xml' = 'application/xml'; '.txt' = 'text/plain; charset=utf-8'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg' }
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).Trim('/')
  if (-not $rel) { $rel = 'index.html' }
  $path = $null
  foreach ($candidate in @($rel, "$rel.html")) {
    $full = [IO.Path]::GetFullPath((Join-Path $root $candidate))
    if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) { $path = $full; break }
  }
  if (-not $path) { $ctx.Response.StatusCode = 404; $path = Join-Path $root '404.html' }
  if (Test-Path $path -PathType Leaf) {
    $bytes = [IO.File]::ReadAllBytes($path)
    $ext = [IO.Path]::GetExtension($path).ToLower()
    $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
    $ctx.Response.Headers.Add('Cache-Control', 'no-store')
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  $ctx.Response.Close()
}
