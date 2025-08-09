# PowerShell Script to Test Backend Functions
# Run: .\test-functions.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

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
    
    Write-ColorOutput "`n📊 $Title" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    
    if ($Response -eq $null) {
        Write-ColorOutput "No data available" "Yellow"
        return
    }
    
    # Handle different response types
    if ($Response.GetType().Name -eq "PSCustomObject") {
        $properties = $Response | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
        
        foreach ($prop in $properties) {
            $value = $Response.$prop
            
            if ($value -eq $null) {
                Write-ColorOutput "$prop`: null" "Gray"
            } elseif ($value.GetType().IsArray) {
                Write-ColorOutput "$prop`: Array with $($value.Count) items" "Yellow"
                if ($value.Count -gt 0 -and $value.Count -le 3) {
                    for ($i = 0; $i -lt $value.Count; $i++) {
                        Write-ColorOutput "  [$i]: $($value[$i] | ConvertTo-Json -Compress -Depth 1)" "White"
                    }
                } elseif ($value.Count -gt 3) {
                    Write-ColorOutput "  [0]: $($value[0] | ConvertTo-Json -Compress -Depth 1)" "White"
                    Write-ColorOutput "  ... and $($value.Count - 1) more items" "Gray"
                }
            } elseif ($value.GetType().Name -eq "PSCustomObject") {
                Write-ColorOutput "$prop`: Object" "Yellow"
                Write-ColorOutput "  $($value | ConvertTo-Json -Compress -Depth 1)" "White"
            } else {
                Write-ColorOutput "$prop`: $value" "White"
            }
        }
    } else {
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
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-ColorOutput "✅ $Name`: Success" "Green"
        if ($response) {
            # Display response data properly
            if ($response.GetType().Name -eq "PSCustomObject" -or $response.GetType().Name -eq "Hashtable") {
                Write-ColorOutput "   Response Data:" "Cyan"
                
                # For objects with common API response structure
                if ($response.data) {
                    Write-ColorOutput "   Data: $($response.data | ConvertTo-Json -Depth 3 -Compress)" "White"
                } elseif ($response.tournaments) {
                    Write-ColorOutput "   Tournaments Count: $($response.tournaments.Count)" "Yellow"
                    if ($response.tournaments.Count -gt 0) {
                        Write-ColorOutput "   First Tournament: $($response.tournaments[0].name)" "White"
                    }
                } elseif ($response.news) {
                    Write-ColorOutput "   News Count: $($response.news.Count)" "Yellow"
                    if ($response.news.Count -gt 0) {
                        Write-ColorOutput "   First News: $($response.news[0].title)" "White"
                    }
                } elseif ($response.matches) {
                    Write-ColorOutput "   Matches Count: $($response.matches.Count)" "Yellow"
                    if ($response.matches.Count -gt 0) {
                        Write-ColorOutput "   First Match: $($response.matches[0].teamA) vs $($response.matches[0].teamB)" "White"
                    }
                } elseif ($response.highlights) {
                    Write-ColorOutput "   Highlights Count: $($response.highlights.Count)" "Yellow"
                    if ($response.highlights.Count -gt 0) {
                        Write-ColorOutput "   First Highlight: $($response.highlights[0].title)" "White"
                    }
                } elseif ($response.users) {
                    Write-ColorOutput "   Users Count: $($response.users.Count)" "Yellow"
                    if ($response.users.Count -gt 0) {
                        Write-ColorOutput "   First User: $($response.users[0].email)" "White"
                    }
                } else {
                    # For simple responses or other structures
                    Write-ColorOutput "   Raw Response: $($response | ConvertTo-Json -Depth 2 -Compress)" "White"
                }
                
                # Show pagination info if available
                if ($response.pagination) {
                    Write-ColorOutput "   Pagination: Page $($response.pagination.page)/$($response.pagination.pages), Total: $($response.pagination.total)" "Yellow"
                }
            } else {
                Write-ColorOutput "   Response: $($response | ConvertTo-Json -Depth 2 -Compress)" "White"
            }
        }
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        Write-ColorOutput "❌ $Name`: $statusCode - $errorMessage" "Red"
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
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $stopwatch.Stop()
        
        Write-ColorOutput "✅ $Name`: Success ($($stopwatch.ElapsedMilliseconds)ms)" "Green"
        
        if ($response -and $ShowDetails) {
            Show-DetailedResponse -Response $response -Title "$Name Response"
        } elseif ($response) {
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
        Write-ColorOutput "❌ $Name`: $statusCode - $errorMessage" "Red"
        return $null
    }
}

# Test Authentication Functions
function Test-AuthFunctions {
    Write-ColorOutput "`n🔐 Testing Authentication Functions..." "Cyan"
    
    # Health Check
    Test-Endpoint "Health Check" "GET" "$BaseUrl/api/health"
    
    # User Registration
    $userData = @{
        email = "testuser@powershell.com"
        password = "password123"
        fullName = "PowerShell Test User"
        role = "user"
    } | ConvertTo-Json
    
    Test-Endpoint "User Registration" "POST" "$BaseUrl/api/auth/register" $userData
    
    # User Login
    $loginData = @{
        email = "testuser@esport.com"
        password = "password123"
    } | ConvertTo-Json
    
    Test-Endpoint "User Login" "POST" "$BaseUrl/api/auth/login" $loginData
    
    # Admin Login
    $adminData = @{
        email = "admin@esport.com"
        password = "admin123"
    } | ConvertTo-Json
    
    Test-Endpoint "Admin Login" "POST" "$BaseUrl/api/auth/login" $adminData
    
    # Organizer Login
    $organizerData = @{
        email = "organizer@esport.com"
        password = "organizer123"
    } | ConvertTo-Json
    
    Test-Endpoint "Organizer Login" "POST" "$BaseUrl/api/auth/login" $organizerData
}

# Test Tournament Functions
function Test-TournamentFunctions {
    Write-ColorOutput "`n🏆 Testing Tournament Functions..." "Cyan"
    
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
    Write-ColorOutput "`n📰 Testing News Functions..." "Cyan"
    
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
    Write-ColorOutput "`n⚽ Testing Match Functions..." "Cyan"
    
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
    Write-ColorOutput "`n🎬 Testing Highlight Functions..." "Cyan"
    
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

# Test User Functions
function Test-UserFunctions {
    Write-ColorOutput "`n👤 Testing User Functions..." "Cyan"
    
    # Get All Users (Admin only)
    Test-Endpoint "Get All Users" "GET" "$BaseUrl/api/users"
    
    # Get Users by Role
    Test-Endpoint "Get Users by Role" "GET" "$BaseUrl/api/users/role/user"
    
    # Search Users
    Test-Endpoint "Search Users" "GET" "$BaseUrl/api/users/search?q=test"
}

# Test Admin Functions
function Test-AdminFunctions {
    Write-ColorOutput "`n👑 Testing Admin Functions..." "Cyan"
    
    # System Statistics
    Test-Endpoint "Get System Stats" "GET" "$BaseUrl/api/admin/stats"
    
    # User Management
    Test-Endpoint "Get User Management" "GET" "$BaseUrl/api/admin/users"
    
    # Tournament Management
    Test-Endpoint "Get Tournament Management" "GET" "$BaseUrl/api/admin/tournaments"
    
    # News Management
    Test-Endpoint "Get News Management" "GET" "$BaseUrl/api/admin/news"
    
    # Match Management
    Test-Endpoint "Get Match Management" "GET" "$BaseUrl/api/admin/matches"
    
    # Highlight Management
    Test-Endpoint "Get Highlight Management" "GET" "$BaseUrl/api/admin/highlights"
}

# Main execution
Write-ColorOutput "🚀 Starting PowerShell Backend Testing..." "Cyan"
Write-ColorOutput "Base URL: $BaseUrl" "Yellow"

# Test all functions
Test-AuthFunctions
Test-TournamentFunctions
Test-NewsFunctions
Test-MatchFunctions
Test-HighlightFunctions
Test-UserFunctions
Test-AdminFunctions

Write-ColorOutput "`n🎉 PowerShell Testing Completed!" "Green"
Write-ColorOutput "Check the results above for any errors." "Yellow"
