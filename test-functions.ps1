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
            Write-ColorOutput "   Response: $($response | ConvertTo-Json -Depth 2)" "Cyan"
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
