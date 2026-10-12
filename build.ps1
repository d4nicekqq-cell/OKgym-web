# Static site build: src/pages/*.html + src/layout.html + src/partials + src/data.json -> dist/
# Usage: powershell -File build.ps1
# Tokens: {{key.path}} from data.json or page front matter (page.*), {{> partial}}, {{content}}.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$out = Join-Path $root 'dist'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Text($path) { [IO.File]::ReadAllText($path, $utf8) }

$data = @{}
function Add-Flat($obj, $prefix) {
  foreach ($p in $obj.PSObject.Properties) {
    $key = if ($prefix) { "$prefix.$($p.Name)" } else { $p.Name }
    if ($p.Value -is [System.Management.Automation.PSCustomObject]) { Add-Flat $p.Value $key }
    else { $script:data[$key] = [string]$p.Value }
  }
}
Add-Flat ((Read-Text (Join-Path $root 'src\data.json')) | ConvertFrom-Json) ''

$partials = @{}
Get-ChildItem (Join-Path $root 'src\partials') -Filter *.html | ForEach-Object { $partials[$_.BaseName] = Read-Text $_.FullName }

function Expand-Tokens($text) {
  for ($i = 0; $i -lt 4; $i++) {
    $text = [regex]::Replace($text, '\{\{>\s*([\w-]+)\s*\}\}', [System.Text.RegularExpressions.MatchEvaluator] {
        param($m)
        $name = $m.Groups[1].Value
        if (-not $partials.ContainsKey($name)) { throw "Unknown partial '$name'" }
        $partials[$name]
      })
  }
  [regex]::Replace($text, '\{\{\s*([\w.-]+)\s*\}\}', [System.Text.RegularExpressions.MatchEvaluator] {
      param($m)
      $key = $m.Groups[1].Value
      if (-not $data.ContainsKey($key)) { throw "Unknown token '$key'" }
      $data[$key]
    })
}

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item (Join-Path $root 'assets') (Join-Path $out 'assets') -Recurse
# Earlier single-page versions, kept for comparison at /<name>/index.html
foreach ($name in 'verze-2', 'predchozi') {
  $extra = Join-Path $root $name
  if (Test-Path $extra) { Copy-Item $extra (Join-Path $out $name) -Recurse }
}

$layout = Read-Text (Join-Path $root 'src\layout.html')
$urls = @()
foreach ($file in Get-ChildItem (Join-Path $root 'src\pages') -Filter *.html) {
  $src = Read-Text $file.FullName
  $front = [regex]::Match($src, '^\s*<!--(.*?)-->', 'Singleline')
  if (-not $front.Success) { throw "Missing front matter in $($file.Name)" }
  foreach ($k in @($data.Keys | Where-Object { $_ -like 'page.*' })) { $data.Remove($k) }
  foreach ($line in $front.Groups[1].Value -split "`n") {
    if ($line -match '^\s*([\w-]+)\s*:\s*(.+?)\s*$') { $data["page.$($Matches[1])"] = $Matches[2] }
  }
  $body = $src.Substring($front.Index + $front.Length).Trim()
  $html = Expand-Tokens ($layout.Replace('{{content}}', $body))
  $nav = $data['page.nav']
  if ($nav) { $html = $html.Replace("data-nav=`"$nav`"", "data-nav=`"$nav`" aria-current=`"page`"") }
  [IO.File]::WriteAllText((Join-Path $out $file.Name), $html, $utf8)
  if ($file.BaseName -ne '404') { $urls += $data['site.url'] + $data['page.path'] }
  Write-Host "built $($file.Name)"
}

$sitemap = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`">`n" +
  (($urls | ForEach-Object { "  <url><loc>$_</loc></url>" }) -join "`n") + "`n</urlset>`n"
[IO.File]::WriteAllText((Join-Path $out 'sitemap.xml'), $sitemap, $utf8)
[IO.File]::WriteAllText((Join-Path $out 'robots.txt'), "User-agent: *`nAllow: /`nSitemap: $($data['site.url'])/sitemap.xml`n", $utf8)
Write-Host "done -> $out"
