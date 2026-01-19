# Simple script to extract INSERT statements from SQL dump
# Usage: powershell -ExecutionPolicy Bypass -File filter-inserts-simple.ps1

$inputFile = "C:\Users\Jayakumar\Downloads\hydraa_2026-01-19_111512.sql"
$outputFile = "C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql"

Write-Host "Reading SQL dump file..." -ForegroundColor Yellow
$content = Get-Content $inputFile -Raw

Write-Host "Filtering for COPY statements..." -ForegroundColor Yellow

# Split content into sections
$sections = $content -split "(?=^COPY public\.)" -match "^COPY public\."

# Filter out empty/null entries and join with newlines
$filteredContent = ($sections | Where-Object { $_ -and $_.Trim() -match "^COPY" }) -join "`n`n"

Write-Host "Writing filtered content to output file..." -ForegroundColor Yellow
$filteredContent | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✓ Complete! INSERT statements extracted to: $outputFile" -ForegroundColor Green
Write-Host "Lines in original file: $(($content -split ""`n"").Count)" -ForegroundColor White
Write-Host "Lines in filtered file: $(($filteredContent -split ""`n"").Count)" -ForegroundColor White