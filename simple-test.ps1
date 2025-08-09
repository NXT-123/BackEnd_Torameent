# Simple PowerShell script to test API endpoints and display data properly
# Usage: .\simple-test.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

# Function to display API response data correctly
function Show-Response {
    param([object]$Response, [string]$Name)
    
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    
    if ($Response -eq $null) {
        Write-Host "No data returned" -ForegroundColor Red
        return
    }
    
    $responseType = $Response.GetType().Name
    Write-Host "Response Type: $responseType" -ForegroundColor Yellow
    
    if ($responseType -eq "PSCustomObject") {
        $properties = $Response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
        Write-Host "Available Properties: $($properties -join ', ')" -ForegroundColor White
        
        foreach ($prop in $properties) {
            $value = $Response.$prop
            
            if ($value -eq $null) {
                Write-Host "$prop: null" -ForegroundColor Gray
            } elseif ($value.GetType().IsArray) {
                Write-Host "$prop: Array with $($value.Count) items" -ForegroundColor Green
                
                if ($value.Count -gt 0) {
                    Write-Host "Sample data from first item:" -ForegroundColor Cyan
                    $firstItem = $value[0]
                    if ($firstItem.GetType().Name -eq "PSCustomObject") {
                        $itemProps = $firstItem | Get-Member -MemberType Properties | Select-Object -First 5 -ExpandProperty Name
                        foreach ($itemProp in $itemProps) {
                            Write-Host "  $itemProp: $($firstItem.$itemProp)" -ForegroundColor White
                        }
                    } else {
                        Write-Host "  $firstItem" -ForegroundColor White
                    }
                    
                    if ($value.Count -gt 1) {
                        Write-Host "  ... and $($value.Count - 1) more items" -ForegroundColor Gray
                    }
                }
            } elseif ($value.GetType().Name -eq "PSCustomObject") {
                Write-Host "$prop: Object with properties:" -ForegroundColor Green
                $subProps = $value | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
                foreach ($subProp in $subProps) {
                    Write-Host "  $subProp: $($value.$subProp)" -ForegroundColor White
                }
            } else {
                Write-Host "$prop: $value" -ForegroundColor White
            }
        }
    } else {
        Write-Host "Raw data: $Response" -ForegroundColor White
    }
    
    Write-Host "================================" -ForegroundColor Cyan
}

# Function to test an API endpoint
function Test-API {
    param([string]$Name, [string]$Url)
    
    try {
        Write-Host "Testing $Name..." -ForegroundColor Green
        Write-Host "URL: $Url" -ForegroundColor Gray
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $Url -Method GET
        $stopwatch.Stop()
        
        Write-Host "SUCCESS! Response time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
        
        Show-Response -Response $response -Name $Name
        
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Main testing
Write-Host "PowerShell API Testing - Fixed Output Display" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Test various endpoints
Test-API -Name "Health Check" -Url "$BaseUrl/api/health"
Test-API -Name "All Tournaments" -Url "$BaseUrl/api/tournaments"
Test-API -Name "All News" -Url "$BaseUrl/api/news"
Test-API -Name "All Matches" -Url "$BaseUrl/api/matches"
Test-API -Name "All Highlights" -Url "$BaseUrl/api/highlights"

Write-Host ""
Write-Host "Testing completed! Data is now displayed properly instead of object metadata." -ForegroundColor Green

# Quick summary function
Write-Host ""
Write-Host "=== QUICK SUMMARY ===" -ForegroundColor Cyan

$endpoints = @(
    @{Name="Tournaments"; Url="$BaseUrl/api/tournaments"},
    @{Name="News"; Url="$BaseUrl/api/news"},
    @{Name="Matches"; Url="$BaseUrl/api/matches"},
    @{Name="Highlights"; Url="$BaseUrl/api/highlights"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
        $dataKey = $endpoint.Name.ToLower()
        if ($response.$dataKey) {
            Write-Host "$($endpoint.Name): $($response.$dataKey.Count) items" -ForegroundColor Green
        } else {
            # Try common property names
            $found = $false
            foreach ($key in @("data", "results", "items")) {
                if ($response.$key) {
                    Write-Host "$($endpoint.Name): $($response.$key.Count) items (in '$key' property)" -ForegroundColor Green
                    $found = $true
                    break
                }
            }
            if (-not $found) {
                $props = $response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
                Write-Host "$($endpoint.Name): Response has properties: $($props -join ', ')" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "$($endpoint.Name): Error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Note: If you still see object metadata, use these commands:" -ForegroundColor Yellow
Write-Host '  $response = Invoke-RestMethod -Uri "URL" -Method GET' -ForegroundColor Gray
Write-Host '  $response | ConvertTo-Json -Depth 3' -ForegroundColor Gray
Write-Host '  $response.tournaments | Format-Table -AutoSize' -ForegroundColor Gray