# Quick fix for PowerShell output display issue
# Run: .\quick-fix.ps1

param([string]$BaseUrl = "http://localhost:3000")

Write-Host "Quick Fix for PowerShell Output Issues" -ForegroundColor Cyan
Write-Host "Testing API: $BaseUrl" -ForegroundColor Yellow

try {
    Write-Host "`nTesting tournaments endpoint..." -ForegroundColor Green
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/tournaments" -Method GET
    
    Write-Host "Response received successfully!" -ForegroundColor Green
    Write-Host "Response type: $($response.GetType().Name)" -ForegroundColor Yellow
    
    # Show properties
    $props = $response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
    Write-Host "Properties found: $($props -join ', ')" -ForegroundColor White
    
    # Show data correctly
    if ($response.tournaments) {
        Write-Host "`nTournaments data:" -ForegroundColor Cyan
        Write-Host "Count: $($response.tournaments.Count)" -ForegroundColor Green
        
        if ($response.tournaments.Count -gt 0) {
            Write-Host "First tournament:" -ForegroundColor Yellow
            $first = $response.tournaments[0]
            $first | Format-List | Out-String | Write-Host
        }
    } else {
        Write-Host "No 'tournaments' property found. Available properties:" -ForegroundColor Red
        foreach ($prop in $props) {
            Write-Host "  $prop = $($response.$prop)" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTip: Use these commands to display data properly:" -ForegroundColor Yellow
Write-Host "  `$response | ConvertTo-Json -Depth 3" -ForegroundColor Gray
Write-Host "  `$response.tournaments | Format-Table -AutoSize" -ForegroundColor Gray
Write-Host "  `$response.tournaments | Select-Object name, game, status" -ForegroundColor Gray