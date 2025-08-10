# PowerShell Script to Test Backend Functions
# Run: .\test-functions.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

# Global variables to store authentication tokens
$script:userToken = $null
$script:adminToken = $null
$script:organizerToken = $null

# Color output function
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message -ForegroundColor White }
    }
}

# Function to display detailed response data
function Show-DetailedResponse {
    param(
        [object]$Response,
        [string]$Title = "Response Details"
    )
    
    Write-ColorOutput "`n$Title" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    
    if ($null -eq $Response) {
        Write-ColorOutput "No data available" "Yellow"
        return
    }
    
    # Handle different response types
    if ($Response.GetType().Name -eq "PSCustomObject") {
        $properties = $Response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
        
        foreach ($prop in $properties) {
            $value = $Response.$prop
            
            if ($null -eq $value) {
                Write-ColorOutput "$prop`: null" "Gray"
            }
            elseif ($value.GetType().IsArray) {
                Write-ColorOutput "$prop`: Array with $($value.Count) items" "Yellow"
                if ($value.Count -gt 0 -and $value.Count -le 3) {
                    for ($i = 0; $i -lt $value.Count; $i++) {
                        Write-ColorOutput "  [$i]: $($value[$i] | ConvertTo-Json -Compress -Depth 1)" "White"
                    }
                }
                elseif ($value.Count -gt 3) {
                    Write-ColorOutput "  [0]: $($value[0] | ConvertTo-Json -Compress -Depth 1)" "White"
                    Write-ColorOutput "  ... and $($value.Count - 1) more items" "Gray"
                }
            }
            elseif ($value.GetType().Name -eq "PSCustomObject") {
                Write-ColorOutput "$prop`: Object" "Yellow"
                Write-ColorOutput "  $($value | ConvertTo-Json -Compress -Depth 1)" "White"
            }
            else {
                Write-ColorOutput "$prop`: $value" "White"
            }
        }
    }
    else {
        Write-ColorOutput "Raw Data: $($Response | ConvertTo-Json -Depth 2)" "White"
    }
    
    Write-ColorOutput "=" * 50 "Cyan"
}

# Test endpoint function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
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
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-ColorOutput "SUCCESS $Name" "Green"
        if ($response) {
            # Display response data properly
            if ($response.GetType().Name -eq "PSCustomObject" -or $response.GetType().Name -eq "Hashtable") {
                Write-ColorOutput "   Response Data:" "Cyan"
                
                # For objects with common API response structure
                if ($response.data) {
                    Write-ColorOutput "   Data: $($response.data | ConvertTo-Json -Depth 3 -Compress)" "White"
                }
                elseif ($response.tournaments) {
                    Write-ColorOutput "   Tournaments Count: $($response.tournaments.Count)" "Yellow"
                    if ($response.tournaments.Count -gt 0) {
                        Write-ColorOutput "   First Tournament: $($response.tournaments[0].name)" "White"
                    }
                }
                elseif ($response.news) {
                    Write-ColorOutput "   News Count: $($response.news.Count)" "Yellow"
                    if ($response.news.Count -gt 0) {
                        Write-ColorOutput "   First News: $($response.news[0].title)" "White"
                    }
                }
                elseif ($response.matches) {
                    Write-ColorOutput "   Matches Count: $($response.matches.Count)" "Yellow"
                    if ($response.matches.Count -gt 0) {
                        Write-ColorOutput "   First Match: $($response.matches[0].teamA) vs $($response.matches[0].teamB)" "White"
                    }
                }
                elseif ($response.highlights) {
                    Write-ColorOutput "   Highlights Count: $($response.highlights.Count)" "Yellow"
                    if ($response.highlights.Count -gt 0) {
                        Write-ColorOutput "   First Highlight: $($response.highlights[0].title)" "White"
                    }
                }
                elseif ($response.users) {
                    Write-ColorOutput "   Users Count: $($response.users.Count)" "Yellow"
                    if ($response.users.Count -gt 0) {
                        Write-ColorOutput "   First User: $($response.users[0].email)" "White"
                    }
                }
                else {
                    # For simple responses or other structures
                    Write-ColorOutput "   Raw Response: $($response | ConvertTo-Json -Depth 2 -Compress)" "White"
                }
                
                # Show pagination info if available
                if ($response.pagination) {
                    Write-ColorOutput "   Pagination: Page $($response.pagination.page)/$($response.pagination.pages), Total: $($response.pagination.total)" "Yellow"
                }
            }
            else {
                Write-ColorOutput "   Response: $($response | ConvertTo-Json -Depth 2 -Compress)" "White"
            }
        }
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        Write-ColorOutput "ERROR $Name - $statusCode - $errorMessage" "Red"
        return $false
    }
}

# Enhanced test endpoint function with detailed display
function Test-EndpointDetailed {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [switch]$ShowDetails
    )
    
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
        
        Write-ColorOutput "SUCCESS $Name ($($stopwatch.ElapsedMilliseconds)ms)" "Green"
        
        if ($response -and $ShowDetails) {
            Show-DetailedResponse -Response $response -Title "$Name Response"
        }
        elseif ($response) {
            # Quick summary
            if ($response.GetType().Name -eq "PSCustomObject") {
                $properties = $response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
                Write-ColorOutput "   Properties: $($properties -join ', ')" "Cyan"
                
                # Show key data counts
                foreach ($prop in @('tournaments', 'news', 'matches', 'highlights', 'users')) {
                    if ($response.$prop) {
                        Write-ColorOutput "   $prop Count: $($response.$prop.Count)" "Yellow"
                    }
                }
            }
        }
        return $response
    }
    catch {
        $stopwatch.Stop()
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        Write-ColorOutput "ERROR $Name - $statusCode - $errorMessage" "Red"
        return $null
    }
}

# Test Authentication Functions and store tokens
function Test-AuthFunctions {
    Write-ColorOutput "`nTesting Authentication Functions..." "Cyan"
    
    # Health Check
    Test-Endpoint "Health Check" "GET" "$BaseUrl/api/health"
    
    # User Registration
    $userData = @{
        email    = "testuser@powershell.com"
        password = "password123"
        fullName = "PowerShell Test User"
        role     = "user"
    } | ConvertTo-Json
    
    Test-Endpoint "User Registration" "POST" "$BaseUrl/api/auth/register" $userData
    
    # User Login
    $loginData = @{
        email    = "testuser@esport.com"
        password = "password123"
    } | ConvertTo-Json
    
    $userResponse = Test-EndpointDetailed "User Login" "POST" "$BaseUrl/api/auth/login" $loginData
    if ($userResponse -and $userResponse.token) {
        $script:userToken = $userResponse.token
        Write-ColorOutput "   User token stored successfully" "Green"
    }
    
    # Admin Login
    $adminData = @{
        email    = "admin@esport.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $adminResponse = Test-EndpointDetailed "Admin Login" "POST" "$BaseUrl/api/auth/login" $adminData
    if ($adminResponse -and $adminResponse.token) {
        $script:adminToken = $adminResponse.token
        Write-ColorOutput "   Admin token stored successfully" "Green"
    }
    
    # Organizer Login
    $organizerData = @{
        email    = "organizer@esport.com"
        password = "organizer123"
    } | ConvertTo-Json
    
    $organizerResponse = Test-EndpointDetailed "Organizer Login" "POST" "$BaseUrl/api/auth/login" $organizerData
    if ($organizerResponse -and $organizerResponse.token) {
        $script:organizerToken = $organizerResponse.token
        Write-ColorOutput "   Organizer token stored successfully" "Green"
    }
}

# Test Tournament Functions
function Test-TournamentFunctions {
    Write-ColorOutput "`nTesting Tournament Functions..." "Cyan"
    
    # Get All Tournaments
    Test-Endpoint "Get All Tournaments" "GET" "$BaseUrl/api/tournaments"
    
    # Get Upcoming Tournaments
    Test-Endpoint "Get Upcoming Tournaments" "GET" "$BaseUrl/api/tournaments/upcoming"
    
    # Search Tournaments
    Test-Endpoint "Search Tournaments" "GET" "$BaseUrl/api/tournaments/search?q=esport"
    
    # Get Tournaments by Game
    Test-Endpoint "Get Tournaments by Game" "GET" "$BaseUrl/api/tournaments/game/valorant"
}

# Test News Functions
function Test-NewsFunctions {
    Write-ColorOutput "`nTesting News Functions..." "Cyan"
    
    # Get All News
    Test-Endpoint "Get All News" "GET" "$BaseUrl/api/news"
    
    # Get News by Category
    Test-Endpoint "Get News by Category" "GET" "$BaseUrl/api/news/category/esport"
    
    # Get News by Tag
    Test-Endpoint "Get News by Tag" "GET" "$BaseUrl/api/news/tag/tournament"
    
    # Search News
    Test-Endpoint "Search News" "GET" "$BaseUrl/api/news/search?q=esport"
}

# Test Match Functions
function Test-MatchFunctions {
    Write-ColorOutput "`nTesting Match Functions..." "Cyan"
    
    # Get All Matches
    Test-Endpoint "Get All Matches" "GET" "$BaseUrl/api/matches"
    
    # Get Upcoming Matches
    Test-Endpoint "Get Upcoming Matches" "GET" "$BaseUrl/api/matches/upcoming"
    
    # Get Matches by Status
    Test-Endpoint "Get Matches by Status" "GET" "$BaseUrl/api/matches/status/scheduled"
    
    # Get Matches by Game
    Test-Endpoint "Get Matches by Game" "GET" "$BaseUrl/api/matches/game/valorant"
    
    # Search Matches
    Test-Endpoint "Search Matches" "GET" "$BaseUrl/api/matches/search?q=final"
}

# Test Highlight Functions
function Test-HighlightFunctions {
    Write-ColorOutput "`nTesting Highlight Functions..." "Cyan"
    
    # Get All Highlights
    Test-Endpoint "Get All Highlights" "GET" "$BaseUrl/api/highlights"
    
    # Get Highlights by Game
    Test-Endpoint "Get Highlights by Game" "GET" "$BaseUrl/api/highlights/game/valorant"
    
    # Get Highlights by Category
    Test-Endpoint "Get Highlights by Category" "GET" "$BaseUrl/api/highlights/category/moments"
    
    # Get Published Highlights
    Test-Endpoint "Get Published Highlights" "GET" "$BaseUrl/api/highlights/published"
    
    # Search Highlights
    Test-Endpoint "Search Highlights" "GET" "$BaseUrl/api/highlights/search?q=amazing"
}

# Test User Functions with authentication
function Test-UserFunctions {
    Write-ColorOutput "`nTesting User Functions..." "Cyan"
    
    if (-not $script:adminToken) {
        Write-ColorOutput "   Skipping User Functions - Admin token not available" "Yellow"
        return
    }
    
    $headers = @{
        "Authorization" = "Bearer $($script:adminToken)"
    }
    
    # Get All Users (Admin only)
    Test-Endpoint "Get All Users" "GET" "$BaseUrl/api/users" -Headers $headers
    
    # Get Users by Role
    Test-Endpoint "Get Users by Role" "GET" "$BaseUrl/api/users/role/user" -Headers $headers
    
    # Search Users
    Test-Endpoint "Search Users" "GET" "$BaseUrl/api/users/search?q=test" -Headers $headers
}

# Test Admin Functions with authentication
function Test-AdminFunctions {
    Write-ColorOutput "`nTesting Admin Functions..." "Cyan"
    
    if (-not $script:adminToken) {
        Write-ColorOutput "   Skipping Admin Functions - Admin token not available" "Yellow"
        return
    }
    
    $headers = @{
        "Authorization" = "Bearer $($script:adminToken)"
    }
    
    # System Statistics
    Test-Endpoint "Get System Stats" "GET" "$BaseUrl/api/admin/stats" -Headers $headers
    
    # User Management
    Test-Endpoint "Get User Management" "GET" "$BaseUrl/api/admin/users" -Headers $headers
    
    # Tournament Management
    Test-Endpoint "Get Tournament Management" "GET" "$BaseUrl/api/admin/tournaments" -Headers $headers
    
    # News Management
    Test-Endpoint "Get News Management" "GET" "$BaseUrl/api/admin/news" -Headers $headers
    
    # Match Management
    Test-Endpoint "Get Match Management" "GET" "$BaseUrl/api/admin/matches" -Headers $headers
    
    # Highlight Management
    Test-Endpoint "Get Highlight Management" "GET" "$BaseUrl/api/admin/highlights" -Headers $headers
}

# Main execution
Write-ColorOutput "Starting PowerShell Backend Testing..." "Cyan"
Write-ColorOutput "Base URL: $BaseUrl" "Yellow"

# Test all functions
Test-AuthFunctions
Test-TournamentFunctions
Test-NewsFunctions
Test-MatchFunctions
Test-HighlightFunctions
Test-UserFunctions
Test-AdminFunctions

Write-ColorOutput "`nPowerShell Testing Completed!" "Green"
Write-ColorOutput "Check the results above for any errors." "Yellow"
