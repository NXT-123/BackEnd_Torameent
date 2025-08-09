# Script để sửa lỗi output PowerShell hiển thị object thay vì data thực tế
# Chạy: .\fix-output.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

# Function để hiển thị data đúng cách
function Show-ApiData {
    param(
        [object]$Response,
        [string]$EndpointName
    )
    
    Write-Host "`n🔍 $EndpointName" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    if ($Response -eq $null) {
        Write-Host "❌ Không có dữ liệu" -ForegroundColor Red
        return
    }
    
    # Kiểm tra loại response
    $responseType = $Response.GetType().Name
    Write-Host "Response Type: $responseType" -ForegroundColor Yellow
    
    if ($responseType -eq "PSCustomObject") {
        # Lấy tất cả properties
        $properties = $Response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
        Write-Host "Properties: $($properties -join ', ')" -ForegroundColor White
        
        # Hiển thị từng property
        foreach ($prop in $properties) {
            $value = $Response.$prop
            
            if ($value -eq $null) {
                Write-Host "$prop`: (null)" -ForegroundColor Gray
            } elseif ($value.GetType().IsArray) {
                Write-Host "$prop`: Array with $($value.Count) items" -ForegroundColor Yellow
                
                # Hiển thị một vài items đầu
                if ($value.Count -gt 0) {
                    Write-Host "  Sample items:" -ForegroundColor Cyan
                    $maxShow = [Math]::Min($value.Count, 3)
                    for ($i = 0; $i -lt $maxShow; $i++) {
                        $item = $value[$i]
                        if ($item.GetType().Name -eq "PSCustomObject") {
                            # Lấy một vài properties quan trọng
                            $sampleProps = $item | Get-Member -MemberType Properties | Select-Object -First 3 -ExpandProperty Name
                            $sampleData = @()
                            foreach ($sProp in $sampleProps) {
                                $sampleData += "$sProp=$($item.$sProp)"
                            }
                            Write-Host "    [$i] $($sampleData -join ', ')" -ForegroundColor White
                        } else {
                            Write-Host "    [$i] $item" -ForegroundColor White
                        }
                    }
                    if ($value.Count -gt 3) {
                        Write-Host "    ... và $($value.Count - 3) items khác" -ForegroundColor Gray
                    }
                }
            } elseif ($value.GetType().Name -eq "PSCustomObject") {
                Write-Host "$prop`: Object" -ForegroundColor Yellow
                $subProps = $value | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
                foreach ($subProp in $subProps) {
                    Write-Host "    $subProp`: $($value.$subProp)" -ForegroundColor White
                }
            } else {
                Write-Host "$prop`: $value" -ForegroundColor White
            }
        }
    } else {
        Write-Host "Data: $Response" -ForegroundColor White
    }
    
    Write-Host "=" * 50 -ForegroundColor Cyan
}

# Function test API với output đúng
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    try {
        Write-Host "`n🚀 Testing: $Name" -ForegroundColor Green
        Write-Host "URL: $Url" -ForegroundColor Gray
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $Url -Method GET
        $stopwatch.Stop()
        
        Write-Host "✅ Success! ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
        
        # Hiển thị data đúng cách
        Show-ApiData -Response $response -EndpointName $Name
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test các endpoints
Write-Host "🔧 Sửa lỗi hiển thị output PowerShell" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow

# Test Health Check
Test-ApiEndpoint -Name "Health Check" -Url "$BaseUrl/api/health"

# Test Tournaments
Test-ApiEndpoint -Name "Tournaments" -Url "$BaseUrl/api/tournaments"

# Test News
Test-ApiEndpoint -Name "News" -Url "$BaseUrl/api/news"

# Test Matches
Test-ApiEndpoint -Name "Matches" -Url "$BaseUrl/api/matches"

# Test Highlights
Test-ApiEndpoint -Name "Highlights" -Url "$BaseUrl/api/highlights"

Write-Host "`n🎉 Hoàn thành! Output hiện tại đã hiển thị data thực tế thay vì object metadata." -ForegroundColor Green
Write-Host "💡 Tip: Sử dụng script này làm template để test các API khác" -ForegroundColor Yellow