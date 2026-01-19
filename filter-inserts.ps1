# PowerShell script to extract only INSERT/COPY statements from PostgreSQL dump
# Usage: .\filter-inserts.ps1 -InputFile "path\to\dump.sql" -OutputFile "path\to\inserts-only.sql"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [Parameter(Mandatory=$true)]
    [string]$OutputFile
)

Write-Host "Filtering SQL dump to keep only INSERT/COPY statements..." -ForegroundColor Green
Write-Host "Input: $InputFile" -ForegroundColor White
Write-Host "Output: $OutputFile" -ForegroundColor White

# Read the entire file
$content = Get-Content $InputFile -Raw

# Split into lines for processing
$lines = $content -split "`n"

# Initialize variables
$inCopyBlock = $false
$copyLines = @()
$outputLines = @()

foreach ($line in $lines) {
    # Check if this is the start of a COPY block
    if ($line -match "^COPY public\.") {
        $inCopyBlock = $true
        $copyLines = @()
        $copyLines += $line
        Write-Host "Found COPY block: $($line.Trim())" -ForegroundColor Yellow
    }
    elseif ($inCopyBlock) {
        $copyLines += $line

        # Check if this is the end of a COPY block (line with just a period)
        if ($line.Trim() -eq "\.") {
            $inCopyBlock = $false
            # Add the complete COPY block to output
            $outputLines += $copyLines
            $outputLines += ""  # Add blank line for readability
        }
    }
}

# Write the filtered content to output file
$outputLines | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "✓ Filtering complete!" -ForegroundColor Green
Write-Host "Extracted $($outputLines.Count) lines containing INSERT/COPY statements" -ForegroundColor White
Write-Host "Output saved to: $OutputFile" -ForegroundColor White