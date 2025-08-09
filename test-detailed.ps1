# PowerShell Script để Test và Hiển Thị Dữ Liệu Chi Tiết
# Chạy: .\test-detailed.ps1

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$ShowDetails = $false,
    [string]$TestType = "all"
)

# Import functions từ file chính
. "$PSScriptRoot\test-functions.ps1"

# Function hiển thị dữ liệu dạng table
function Show-DataTable {
    param(
        [object]$Data,
        [string]$Title,
        [string[]]$Properties = @()
    )
    
    if (-not $Data) {
        Write-ColorOutput "No data to display for $Title" "Red"
        return
    }
    
    Write-ColorOutput "`n$Title" "Cyan"
    Write-ColorOutput "=" * 60 "Cyan"
    
    if ($Data.GetType().IsArray) {
        if ($Data.Count -eq 0) {
            Write-ColorOutput "Empty array" "Yellow"
            return
        }
        
        if ($Properties.Count -gt 0) {
            $Data | Select-Object $Properties | Format-Table -AutoSize | Out-String | Write-Host
        }
        else {
            $Data | Format-Table -AutoSize | Out-String | Write-Host
        }
        
        Write-ColorOutput "Total items: $($Data.Count)" "Yellow"
    }
    else {
        # Single object
        if ($Properties.Count -gt 0) {
            $Data | Select-Object $Properties | Format-List | Out-String | Write-Host
        }
        else {
            $Data | Format-List | Out-String | Write-Host
        }
    }
}

# Test với hiển thị chi tiết
function Test-WithDetails {
    param(
        [string]$EndpointName,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    Write-ColorOutput "`nTesting: $EndpointName" "Cyan"
    Write-ColorOutput "URL: $Url" "Gray"
    
    try {
        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $stopwatch.Stop()
        
        Write-ColorOutput "SUCCESS! Response time: $($stopwatch.ElapsedMilliseconds)ms" "Green"
        
        # Analyze and display response
        if ($response) {
            Write-ColorOutput "`nResponse Analysis:" "Cyan"
            
            # Check response type
            $responseType = $response.GetType().Name
            Write-ColorOutput "Response Type: $responseType" "Yellow"
            
            if ($responseType -eq "PSCustomObject") {
                $properties = $response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
                Write-ColorOutput "Properties: $($properties -join ', ')" "White"
                
                # Display specific data based on common API patterns
                foreach ($prop in $properties) {
                    $value = $response.$prop
                    
                    if ($null -eq $value) {
                        Write-ColorOutput "$prop`: null" "Gray"
                    }
                    elseif ($value.GetType().IsArray) {
                        Write-ColorOutput "$prop`: Array[$($value.Count)]" "Yellow"
                        
                        # Show array contents
                        if ($value.Count -gt 0) {
                            switch ($prop) {
                                "tournaments" {
                                    Show-DataTable -Data $value -Title "Tournaments" -Properties @("name", "game", "status", "startDate", "maxParticipants")
                                }
                                "news" {
                                    Show-DataTable -Data $value -Title "News Articles" -Properties @("title", "category", "status", "publishedAt")
                                }
                                "matches" {
                                    Show-DataTable -Data $value -Title "Matches" -Properties @("teamA", "teamB", "game", "status", "scheduledTime")
                                }
                                "highlights" {
                                    Show-DataTable -Data $value -Title "Highlights" -Properties @("title", "game", "category", "duration", "status")
                                }
                                "users" {
                                    Show-DataTable -Data $value -Title "Users" -Properties @("email", "fullName", "role", "isActive", "createdAt")
                                }
                                default {
                                    if ($value.Count -le 5) {
                                        $value | ForEach-Object { Write-ColorOutput "  - $($_)" "White" }
                                    }
                                    else {
                                        for ($i = 0; $i -lt 3; $i++) {
                                            Write-ColorOutput "  [$i] $($value[$i])" "White"
                                        }
                                        Write-ColorOutput "  ... and $($value.Count - 3) more items" "Gray"
                                    }
                                }
                            }
                        }
                    }
                    elseif ($value.GetType().Name -eq "PSCustomObject") {
                        Write-ColorOutput "$prop`: Object" "Yellow"
                        $value | Format-List | Out-String | Write-Host
                    }
                    else {
                        Write-ColorOutput "$prop`: $value" "White"
                    }
                }
            }
            else {
                Write-ColorOutput "Raw Response:" "Yellow"
                $response | Out-String | Write-Host
            }
        }
        else {
            Write-ColorOutput "No response data" "Yellow"
        }
        
        return $response
    }
    catch {
        $stopwatch.Stop()
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        Write-ColorOutput "ERROR: $statusCode - $errorMessage" "Red"
        
        # Try to get more error details
        if ($_.Exception.Response) {
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd()
                if ($errorBody) {
                    Write-ColorOutput "Error Details: $errorBody" "Red"
                }
            }
            catch {
                # Ignore if can't read error body
            }
        }
        
        return $null
    }
}

# Main testing functions
function Test-AllEndpoints {
    Write-ColorOutput "Starting Detailed Backend Testing..." "Cyan"
    Write-ColorOutput "Base URL: $BaseUrl" "Yellow"
    Write-ColorOutput "Show Details: $ShowDetails" "Yellow"
    
    # Health Check
    Test-WithDetails -EndpointName "Health Check" -Url "$BaseUrl/api/health"
    
    # Tournaments
    Test-WithDetails -EndpointName "All Tournaments" -Url "$BaseUrl/api/tournaments"
    Test-WithDetails -EndpointName "Upcoming Tournaments" -Url "$BaseUrl/api/tournaments/upcoming"
    Test-WithDetails -EndpointName "Search Tournaments" -Url "$BaseUrl/api/tournaments/search?q=esport"
    
    # News
    Test-WithDetails -EndpointName "All News" -Url "$BaseUrl/api/news"
    Test-WithDetails -EndpointName "News by Category" -Url "$BaseUrl/api/news/category/esport"
    Test-WithDetails -EndpointName "Search News" -Url "$BaseUrl/api/news/search?q=esport"
    
    # Matches
    Test-WithDetails -EndpointName "All Matches" -Url "$BaseUrl/api/matches"
    Test-WithDetails -EndpointName "Upcoming Matches" -Url "$BaseUrl/api/matches/upcoming"
    Test-WithDetails -EndpointName "Search Matches" -Url "$BaseUrl/api/matches/search?q=final"
    
    # Highlights
    Test-WithDetails -EndpointName "All Highlights" -Url "$BaseUrl/api/highlights"
    Test-WithDetails -EndpointName "Published Highlights" -Url "$BaseUrl/api/highlights/published"
    Test-WithDetails -EndpointName "Search Highlights" -Url "$BaseUrl/api/highlights/search?q=amazing"
}

function Test-AuthenticationFlow {
    Write-ColorOutput "`nTesting Authentication Flow..." "Cyan"
    
    # User Login
    $loginData = @{
        email    = "testuser@esport.com"
        password = "password123"
    } | ConvertTo-Json
    
    $userResponse = Test-WithDetails -EndpointName "User Login" -Url "$BaseUrl/api/auth/login" -Method "POST" -Body $loginData
    
    if ($userResponse -and $userResponse.token) {
        $userToken = $userResponse.token
        $headers = @{ "Authorization" = "Bearer $userToken" }
        
        # Get Profile
        Test-WithDetails -EndpointName "User Profile" -Url "$BaseUrl/api/auth/profile" -Headers $headers
    }
    
    # Admin Login
    $adminData = @{
        email    = "admin@esport.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $adminResponse = Test-WithDetails -EndpointName "Admin Login" -Url "$BaseUrl/api/auth/login" -Method "POST" -Body $adminData
    
    if ($adminResponse -and $adminResponse.token) {
        $adminToken = $adminResponse.token
        $adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
        
        # Admin Functions
        Test-WithDetails -EndpointName "System Stats" -Url "$BaseUrl/api/admin/stats" -Headers $adminHeaders
        Test-WithDetails -EndpointName "All Users" -Url "$BaseUrl/api/users" -Headers $adminHeaders
    }
}

function Show-QuickSummary {
    Write-ColorOutput "`nQuick Data Summary" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    
    $endpoints = @(
        @{Name = "Tournaments"; Url = "$BaseUrl/api/tournaments"; DataKey = "tournaments" },
        @{Name = "News"; Url = "$BaseUrl/api/news"; DataKey = "news" },
        @{Name = "Matches"; Url = "$BaseUrl/api/matches"; DataKey = "matches" },
        @{Name = "Highlights"; Url = "$BaseUrl/api/highlights"; DataKey = "highlights" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
            if ($response.($endpoint.DataKey)) {
                $count = $response.($endpoint.DataKey).Count
                Write-ColorOutput "$($endpoint.Name): $count items" "Green"
            }
            else {
                Write-ColorOutput "$($endpoint.Name): No data or different structure" "Yellow"
            }
        }
        catch {
            Write-ColorOutput "$($endpoint.Name): Error - $($_.Exception.Message)" "Red"
        }
    }
}

# Main execution logic
switch ($TestType.ToLower()) {
    "all" { 
        Test-AllEndpoints
        Test-AuthenticationFlow
    }
    "endpoints" { Test-AllEndpoints }
    "auth" { Test-AuthenticationFlow }
    "summary" { Show-QuickSummary }
    default { 
        Write-ColorOutput "Invalid test type. Use: all, endpoints, auth, or summary" "Red"
        exit 1
    }
}

Write-ColorOutput "`nDetailed Testing Completed!" "Green"
Write-ColorOutput "Use -ShowDetails for more detailed output" "Yellow"
Write-ColorOutput "Use -TestType [all|endpoints|auth|summary] to run specific tests" "Yellow"