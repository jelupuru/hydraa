$inputFile = "C:\Users\Jayakumar\Downloads\hydraa_2026-01-19_111512.sql"
$outputFile = "C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql"

Write-Host "Reading SQL dump file..." -ForegroundColor Yellow
$content = Get-Content $inputFile -Raw

Write-Host "Extracting COPY blocks..." -ForegroundColor Yellow

# Find all COPY blocks
$copyPattern = '(?s)COPY public\..*?(?=\n\n|\Z)'
$matches = [regex]::Matches($content, $copyPattern)

$copyBlocks = @()
foreach ($match in $matches) {
    $copyBlocks += $match.Value.Trim()
}

# Join with double newlines
$filteredContent = $copyBlocks -join "`n`n"

Write-Host "Writing to output file..." -ForegroundColor Yellow
$filteredContent | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Complete!" -ForegroundColor Green
Write-Host 'Extracted' $copyBlocks.Count 'COPY blocks' -ForegroundColor White
Write-Host 'Output saved to:' $outputFile -ForegroundColor White