# Tournament Management System - API Testing Script
# Test tất cả các chức năng trong README

$baseUrl = "http://localhost:3000/api"
$logFile = "api-test-results.txt"

# Clear log file
"# Tournament Management System - API Test Results" | Out-File -FilePath $logFile -Encoding UTF8
"Generated at: $(Get-Date)" | Out-File -FilePath $logFile -Append -Encoding UTF8
"" | Out-File -FilePath $logFile -Append -Encoding UTF8

# Function to log test results
function Write-TestResult {
    param($testName, $command, $result, $success)
    
    "## $testName" | Out-File -FilePath $logFile -Append -Encoding UTF8
    "**Command:**" | Out-File -FilePath $logFile -Append -Encoding UTF8
    $command | Out-File -FilePath $logFile -Append -Encoding UTF8
    "**Result:**" | Out-File -FilePath $logFile -Append -Encoding UTF8
    if ($success) {
        "✅ SUCCESS" | Out-File -FilePath $logFile -Append -Encoding UTF8
    }
    else {
        "❌ FAILED" | Out-File -FilePath $logFile -Append -Encoding UTF8
    }
    $result | ConvertTo-Json -Depth 10 | Out-File -FilePath $logFile -Append -Encoding UTF8
    "" | Out-File -FilePath $logFile -Append -Encoding UTF8
    "---" | Out-File -FilePath $logFile -Append -Encoding UTF8
    "" | Out-File -FilePath $logFile -Append -Encoding UTF8
}

# Function to test API endpoint
function Test-APIEndpoint {
    param($testName, $uri, $method = "GET", $body = $null, $headers = @{})
    
    try {
        $params = @{
            Uri    = $uri
            Method = $method
        }
        
        if ($body) {
            $params.ContentType = "application/json"
            $params.Body = $body
        }
        
        if ($headers.Count -gt 0) {
            $params.Headers = $headers
        }
        
        $result = Invoke-RestMethod @params
        Write-TestResult -testName $testName -command "Invoke-RestMethod -Uri `"$uri`" -Method $method" -result $result -success $true
        return $result
    }
    catch {
        Write-TestResult -testName $testName -command "Invoke-RestMethod -Uri `"$uri`" -Method $method" -result $_.Exception.Message -success $false
        return $null
    }
}

Write-Host "Starting API tests..." -ForegroundColor Green

# 1. Health Check
Write-Host "Testing Health Check..." -ForegroundColor Yellow
Test-APIEndpoint -testName "Health Check" -uri "$baseUrl/health"

# 2. API Documentation
Write-Host "Testing API Documentation..." -ForegroundColor Yellow
Test-APIEndpoint -testName "API Documentation" -uri "$baseUrl"

# 3. Authentication Tests
Write-Host "Testing Authentication..." -ForegroundColor Yellow

# Register
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "testuser$timestamp@example.com"
$registerBody = '{"email":"' + $email + '","fullName":"Test User","password":"123456","role":"organizer"}'
$registerResult = Test-APIEndpoint -testName "User Registration" -uri "$baseUrl/auth/register" -method "POST" -body $registerBody

# Login
$loginBody = '{"email":"' + $email + '","password":"123456"}'
$loginResult = Test-APIEndpoint -testName "User Login" -uri "$baseUrl/auth/login" -method "POST" -body $loginBody

# Extract token if login successful
$token = $null
if ($loginResult -and $loginResult.success) {
    $token = $loginResult.data.token
    Write-Host "Login successful, token obtained" -ForegroundColor Green
}
else {
    Write-Host "Login failed, using null token for subsequent tests" -ForegroundColor Red
}

# 4. Tournament Tests
Write-Host "Testing Tournaments..." -ForegroundColor Yellow

# Get all tournaments
Test-APIEndpoint -testName "Get All Tournaments" -uri "$baseUrl/tournaments?page=1&limit=10"

# Get tournaments with filters
Test-APIEndpoint -testName "Get Tournaments with Status Filter" -uri "$baseUrl/tournaments?page=1&limit=10&status=upcoming"

# Get tournaments with search
Test-APIEndpoint -testName "Get Tournaments with Search" -uri "$baseUrl/tournaments?page=1&limit=10&search=League"

# Get upcoming tournaments
Test-APIEndpoint -testName "Get Upcoming Tournaments" -uri "$baseUrl/tournaments/upcoming"

# Get ongoing tournaments
Test-APIEndpoint -testName "Get Ongoing Tournaments" -uri "$baseUrl/tournaments/ongoing"

# Create tournament (if we have token)
if ($token) {
    $createTournamentBody = '{"name":"Test Tournament","gameName":"Test Game","format":"single-elimination","description":"Test tournament","startDate":"2025-12-01","endDate":"2025-12-10","maxPlayers":16}'
    $createTournamentResult = Test-APIEndpoint -testName "Create Tournament" -uri "$baseUrl/tournaments" -method "POST" -body $createTournamentBody -headers @{"Authorization" = "Bearer $token" }
    
    # Get tournament by ID if created successfully
    if ($createTournamentResult -and $createTournamentResult.success) {
        $tournamentId = $createTournamentResult.data.tournament._id
        Test-APIEndpoint -testName "Get Tournament by ID" -uri "$baseUrl/tournaments/$tournamentId"
        
        # Update tournament
        $updateTournamentBody = '{"description":"Updated description"}'
        Test-APIEndpoint -testName "Update Tournament" -uri "$baseUrl/tournaments/$tournamentId" -method "PUT" -body $updateTournamentBody -headers @{"Authorization" = "Bearer $token" }
        
        # Update tournament status
        $updateStatusBody = '{"status":"ongoing"}'
        Test-APIEndpoint -testName "Update Tournament Status" -uri "$baseUrl/tournaments/$tournamentId/status" -method "PUT" -body $updateStatusBody -headers @{"Authorization" = "Bearer $token" }
        
        # Get tournament participants
        Test-APIEndpoint -testName "Get Tournament Participants" -uri "$baseUrl/tournaments/$tournamentId/participants"
        
        # Register for tournament
        $registerTeamBody = '{"name":"Test Team","logoUrl":"https://example.com/logo.png","description":"Test team","mail":"team@example.com"}'
        $registerTeamResult = Test-APIEndpoint -testName "Register for Tournament" -uri "$baseUrl/tournaments/$tournamentId/register" -method "POST" -body $registerTeamBody -headers @{"Authorization" = "Bearer $token" }
        
        # Delete tournament
        Test-APIEndpoint -testName "Delete Tournament" -uri "$baseUrl/tournaments/$tournamentId" -method "DELETE" -headers @{"Authorization" = "Bearer $token" }
    }
}

# 5. News Tests
Write-Host "Testing News..." -ForegroundColor Yellow

# Get all news
Test-APIEndpoint -testName "Get All News" -uri "$baseUrl/news?page=1&limit=10"

# Get featured news
Test-APIEndpoint -testName "Get Featured News" -uri "$baseUrl/news/featured?limit=5"

# Search news
Test-APIEndpoint -testName "Search News" -uri "$baseUrl/news/search?q=test&page=1&limit=10"

# Create news (if we have token)
if ($token) {
    $createNewsBody = '{"title":"Test News","content":"This is a test news article","images":["https://example.com/image.jpg"]}'
    $createNewsResult = Test-APIEndpoint -testName "Create News" -uri "$baseUrl/news" -method "POST" -body $createNewsBody -headers @{"Authorization" = "Bearer $token" }
    
    if ($createNewsResult -and $createNewsResult.success) {
        $newsId = $createNewsResult.data.news._id
        Test-APIEndpoint -testName "Get News by ID" -uri "$baseUrl/news/$newsId"
        
        # Update news
        $updateNewsBody = '{"title":"Updated News Title"}'
        Test-APIEndpoint -testName "Update News" -uri "$baseUrl/news/$newsId" -method "PUT" -body $updateNewsBody -headers @{"Authorization" = "Bearer $token" }
        
        # Publish news
        Test-APIEndpoint -testName "Publish News" -uri "$baseUrl/news/$newsId/publish" -method "PUT" -headers @{"Authorization" = "Bearer $token" }
        
        # Delete news
        Test-APIEndpoint -testName "Delete News" -uri "$baseUrl/news/$newsId" -method "DELETE" -headers @{"Authorization" = "Bearer $token" }
    }
}

# 6. Matches Tests
Write-Host "Testing Matches..." -ForegroundColor Yellow

# Get all matches
Test-APIEndpoint -testName "Get All Matches" -uri "$baseUrl/matches?page=1&limit=10"

# Get upcoming matches
Test-APIEndpoint -testName "Get Upcoming Matches" -uri "$baseUrl/matches/upcoming"

# Get ongoing matches
Test-APIEndpoint -testName "Get Ongoing Matches" -uri "$baseUrl/matches/ongoing"

# Create match (if we have token and tournament)
if ($token) {
    # Get first tournament for match creation
    $tournaments = Invoke-RestMethod -Uri "$baseUrl/tournaments?page=1&limit=1" -Method GET
    if ($tournaments.success -and $tournaments.data.tournaments.Count -gt 0) {
        $tournamentId = $tournaments.data.tournaments[0]._id
        
        # Get first two competitors for match creation
        $competitors = Invoke-RestMethod -Uri "$baseUrl/tournaments/$tournamentId/participants" -Method GET
        if ($competitors.success -and $competitors.data.competitors.Count -ge 2) {
            $teamAId = $competitors.data.competitors[0]._id
            $teamBId = $competitors.data.competitors[1]._id
            $createMatchBody = '{"tournamentId":"' + $tournamentId + '","teamA":"' + $teamAId + '","teamB":"' + $teamBId + '","scheduledAt":"2025-12-15T10:00:00Z"}'
        }
        else {
            # Create test competitors first
            $createTeamABody = '{"name":"Test Team A","logoUrl":"https://example.com/teamA.png","description":"Test team A","mail":"teama@example.com"}'
            $createTeamBBody = '{"name":"Test Team B","logoUrl":"https://example.com/teamB.png","description":"Test team B","mail":"teamb@example.com"}'
            
            $teamAResult = Invoke-RestMethod -Uri "$baseUrl/tournaments/$tournamentId/register" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token" } -Body $createTeamABody
            $teamBResult = Invoke-RestMethod -Uri "$baseUrl/tournaments/$tournamentId/register" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token" } -Body $createTeamBBody
            
            if ($teamAResult.success -and $teamBResult.success) {
                $teamAId = $teamAResult.data.competitor._id
                $teamBId = $teamBResult.data.competitor._id
                $createMatchBody = '{"tournamentId":"' + $tournamentId + '","teamA":"' + $teamAId + '","teamB":"' + $teamBId + '","scheduledAt":"2025-12-15T10:00:00Z"}'
            }
            else {
                Write-Host "Failed to create test teams for match" -ForegroundColor Red
                continue
            }
        }
        $createMatchResult = Test-APIEndpoint -testName "Create Match" -uri "$baseUrl/matches" -method "POST" -body $createMatchBody -headers @{"Authorization" = "Bearer $token" }
        
        if ($createMatchResult -and $createMatchResult.success) {
            $matchId = $createMatchResult.data.match._id
            Test-APIEndpoint -testName "Get Match by ID" -uri "$baseUrl/matches/$matchId"
            
            # Start match
            Test-APIEndpoint -testName "Start Match" -uri "$baseUrl/matches/$matchId/start" -method "PUT" -headers @{"Authorization" = "Bearer $token" }
            
            # Set match result
            $setResultBody = '{"scoreA":2,"scoreB":1}'
            Test-APIEndpoint -testName "Set Match Result" -uri "$baseUrl/matches/$matchId/result" -method "PUT" -body $setResultBody -headers @{"Authorization" = "Bearer $token" }
            
            # Reschedule match
            $rescheduleBody = '{"newDate":"2025-12-16T10:00:00Z"}'
            Test-APIEndpoint -testName "Reschedule Match" -uri "$baseUrl/matches/$matchId/reschedule" -method "PUT" -body $rescheduleBody -headers @{"Authorization" = "Bearer $token" }
            
            # Get matches by tournament
            Test-APIEndpoint -testName "Get Matches by Tournament" -uri "$baseUrl/matches/tournament/$tournamentId?page=1&limit=10"
        }
    }
}

# 7. Highlights Tests
Write-Host "Testing Highlights..." -ForegroundColor Yellow

# Get all highlights
Test-APIEndpoint -testName "Get All Highlights" -uri "$baseUrl/highlights?page=1&limit=10"

# Get featured highlights
Test-APIEndpoint -testName "Get Featured Highlights" -uri "$baseUrl/highlights/featured?limit=5"

# Get popular highlights
Test-APIEndpoint -testName "Get Popular Highlights" -uri "$baseUrl/highlights/popular?limit=10"

# Search highlights
Test-APIEndpoint -testName "Search Highlights" -uri "$baseUrl/highlights/search?q=epic&page=1&limit=10"

# Create highlight (if we have token)
if ($token) {
    $createHighlightBody = '{"title":"Test Highlight","description":"This is a test highlight","videoUrl":"https://example.com/video.mp4","status":"public"}'
    $createHighlightResult = Test-APIEndpoint -testName "Create Highlight" -uri "$baseUrl/highlights" -method "POST" -body $createHighlightBody -headers @{"Authorization" = "Bearer $token" }
    
    if ($createHighlightResult -and $createHighlightResult.success) {
        $highlightId = $createHighlightResult.data.highlight._id
        Test-APIEndpoint -testName "Get Highlight by ID" -uri "$baseUrl/highlights/$highlightId"
        
        # Update highlight
        $updateHighlightBody = '{"title":"Updated Highlight Title"}'
        Test-APIEndpoint -testName "Update Highlight" -uri "$baseUrl/highlights/$highlightId" -method "PUT" -body $updateHighlightBody -headers @{"Authorization" = "Bearer $token" }
        
        # Update highlight status
        $updateHighlightStatusBody = '{"status":"private"}'
        Test-APIEndpoint -testName "Update Highlight Status" -uri "$baseUrl/highlights/$highlightId/status" -method "PUT" -body $updateHighlightStatusBody -headers @{"Authorization" = "Bearer $token" }
        
        # Delete highlight
        Test-APIEndpoint -testName "Delete Highlight" -uri "$baseUrl/highlights/$highlightId" -method "DELETE" -headers @{"Authorization" = "Bearer $token" }
    }
}

# 8. Profile Tests (if we have token)
if ($token) {
    Write-Host "Testing Profile..." -ForegroundColor Yellow
    
    # Get profile
    Test-APIEndpoint -testName "Get Profile" -uri "$baseUrl/auth/profile" -headers @{"Authorization" = "Bearer $token" }
    
    # Update profile
    $updateProfileBody = '{"fullName":"Updated Name","avatarUrl":"https://example.com/avatar.jpg"}'
    Test-APIEndpoint -testName "Update Profile" -uri "$baseUrl/auth/profile" -method "PUT" -body $updateProfileBody -headers @{"Authorization" = "Bearer $token" }
    
    # Change password
    $changePasswordBody = '{"currentPassword":"123456","newPassword":"654321"}'
    Test-APIEndpoint -testName "Change Password" -uri "$baseUrl/auth/change-password" -method "PUT" -body $changePasswordBody -headers @{"Authorization" = "Bearer $token" }
}

Write-Host "API testing completed! Results saved to $logFile" -ForegroundColor Green
Write-Host "Check the log file for detailed results of all API tests." -ForegroundColor Cyan
