# 🚀 Hướng Dẫn Test Backend Bằng PowerShell

## 📋 Yêu Cầu
- PowerShell 5.0 trở lên
- Backend server đang chạy trên `http://localhost:3000`
- Database đã được khởi tạo với dữ liệu test

## 🔧 Cài Đặt và Khởi Động

### 1. Khởi động Backend Server
```powershell
# Terminal 1: Khởi động server
npm start

# Hoặc chạy trong background
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
```

### 2. Khởi tạo Database (nếu chưa có)
```powershell
# Terminal 2: Khởi tạo dữ liệu test
npm run init-db

# Kiểm tra database đã sẵn sàng
Start-Sleep -Seconds 3
```

### 3. Kiểm tra Server Status
```powershell
# Kiểm tra port 3000 có đang listen không
Test-NetConnection -ComputerName localhost -Port 3000

# Kiểm tra process Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Kiểm tra health endpoint
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "✅ Server is running: $($health | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not responding" -ForegroundColor Red
}
```

## 🧪 Chạy Test Bằng PowerShell

### Cách 1: Chạy Script Tự Động
```powershell
# Chạy toàn bộ test suite
.\test-functions.ps1

# Chạy với URL tùy chỉnh
.\test-functions.ps1 -BaseUrl "http://localhost:3000"
```

### Cách 2: Chạy Từng Chức Năng Riêng Lẻ

#### 🔐 Test Authentication
```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET

# API Documentation
Invoke-RestMethod -Uri "http://localhost:3000/api/docs" -Method GET

# User Registration
$userData = @{
    email = "newuser@test.com"
    password = "password123"
    fullName = "New Test User"
    role = "user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $userData -ContentType "application/json"

# User Login
$loginData = @{
    email = "testuser@esport.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $response.token

# Admin Login
$adminData = @{
    email = "admin@esport.com"
    password = "admin123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $adminData -ContentType "application/json"
$adminToken = $adminResponse.token

# Organizer Login
$organizerData = @{
    email = "organizer@esport.com"
    password = "organizer123"
} | ConvertTo-Json

$organizerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $organizerData -ContentType "application/json"
$organizerToken = $organizerResponse.token

# Get User Profile
$headers = @{
    "Authorization" = "Bearer $token"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers $headers

# Change Password
$passwordData = @{
    currentPassword = "password123"
    newPassword = "newpassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/change-password" -Method PUT -Body $passwordData -ContentType "application/json" -Headers $headers

# Logout
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/logout" -Method POST -Headers $headers
```

#### 🏆 Test Tournaments
```powershell
# Get All Tournaments
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method GET

# Get Tournament by ID
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/507f1f77bcf86cd799439011" -Method GET

# Get Upcoming Tournaments
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/upcoming" -Method GET

# Search Tournaments
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/search?q=esport" -Method GET

# Get Tournaments by Game
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/game/valorant" -Method GET

# Get Tournament Statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/stats" -Method GET

# Create Tournament (Organizer Required)
$tournamentData = @{
    name = "PowerShell Test Tournament"
    description = "Tournament created via PowerShell testing"
    game = "valorant"
    startDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endDate = (Get-Date).AddDays(37).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    maxParticipants = 16
    entryFee = 0
    prizePool = 1000
    status = "registration"
    rules = "Standard tournament rules apply"
    registrationDeadline = (Get-Date).AddDays(25).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $organizerToken"
}

$newTournament = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method POST -Body $tournamentData -ContentType "application/json" -Headers $headers

# Update Tournament
$updateData = @{
    description = "Updated tournament description via PowerShell"
    maxParticipants = 32
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$($newTournament._id)" -Method PUT -Body $updateData -ContentType "application/json" -Headers $headers

# Delete Tournament
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$($newTournament._id)" -Method DELETE -Headers $headers
```

#### 📰 Test News
```powershell
# Get All News
Invoke-RestMethod -Uri "http://localhost:3000/api/news" -Method GET

# Get News by ID
Invoke-RestMethod -Uri "http://localhost:3000/api/news/507f1f77bcf86cd799439011" -Method GET

# Get News by Category
Invoke-RestMethod -Uri "http://localhost:3000/api/news/category/esport" -Method GET

# Get News by Tag
Invoke-RestMethod -Uri "http://localhost:3000/api/news/tag/tournament" -Method GET

# Get Published News
Invoke-RestMethod -Uri "http://localhost:3000/api/news/published" -Method GET

# Search News
Invoke-RestMethod -Uri "http://localhost:3000/api/news/search?q=esport" -Method GET

# Get News Statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/news/stats" -Method GET

# Create News (Admin Required)
$newsData = @{
    title = "PowerShell Testing News"
    content = "This news article was created via PowerShell testing. It contains detailed information about the testing process."
    category = "testing"
    tags = @("powershell", "testing", "backend", "api")
    status = "published"
    authorId = "507f1f77bcf86cd799439011"
    publishedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$newNews = Invoke-RestMethod -Uri "http://localhost:3000/api/news" -Method POST -Body $newsData -ContentType "application/json" -Headers $headers

# Update News
$updateData = @{
    content = "Updated news content via PowerShell testing"
    tags = @("powershell", "testing", "backend", "api", "updated")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/news/$($newNews._id)" -Method PUT -Body $updateData -ContentType "application/json" -Headers $headers

# Delete News
Invoke-RestMethod -Uri "http://localhost:3000/api/news/$($newNews._id)" -Method DELETE -Headers $headers
```

#### ⚽ Test Matches
```powershell
# Get All Matches
Invoke-RestMethod -Uri "http://localhost:3000/api/matches" -Method GET

# Get Match by ID
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/507f1f77bcf86cd799439011" -Method GET

# Get Matches by Tournament
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/tournament/507f1f77bcf86cd799439011" -Method GET

# Get Upcoming Matches
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/upcoming" -Method GET

# Get Matches by Status
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/status/scheduled" -Method GET

# Get Matches by Game
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/game/valorant" -Method GET

# Search Matches
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/search?q=final" -Method GET

# Get Match Results
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/results" -Method GET

# Create Match (Admin Required)
$matchData = @{
    tournamentId = "507f1f77bcf86cd799439011"
    teamA = "Team Alpha"
    teamB = "Team Beta"
    game = "valorant"
    scheduledTime = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    status = "scheduled"
    format = "bo3"
    description = "Match created via PowerShell testing"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$newMatch = Invoke-RestMethod -Uri "http://localhost:3000/api/matches" -Method POST -Body $matchData -ContentType "application/json" -Headers $headers

# Update Match Score
$scoreData = @{
    teamAScore = 2
    teamBScore = 1
    status = "completed"
    winner = "Team Alpha"
    highlights = @("Round 5 clutch", "Final round ace")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/matches/$($newMatch._id)/score" -Method PUT -Body $scoreData -ContentType "application/json" -Headers $headers

# Delete Match
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/$($newMatch._id)" -Method DELETE -Headers $headers
```

#### 🎬 Test Highlights
```powershell
# Get All Highlights
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights" -Method GET

# Get Highlight by ID
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/507f1f77bcf86cd799439011" -Method GET

# Get Highlights by Game
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/game/valorant" -Method GET

# Get Highlights by Category
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/category/moments" -Method GET

# Get Highlights by Tag
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/tag/clutch" -Method GET

# Get Published Highlights
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/published" -Method GET

# Get Trending Highlights
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/trending" -Method GET

# Search Highlights
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/search?q=amazing" -Method GET

# Get Highlights by Duration
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/duration/short" -Method GET

# Get Highlights Statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/stats" -Method GET

# Create Highlight (Admin Required)
$highlightData = @{
    title = "PowerShell Test Highlight"
    description = "Amazing play created via PowerShell testing"
    videoUrl = "https://example.com/video.mp4"
    thumbnailUrl = "https://example.com/thumbnail.jpg"
    game = "valorant"
    category = "moments"
    tags = @("powershell", "testing", "amazing", "play")
    duration = 30
    status = "published"
    authorId = "507f1f77bcf86cd799439011"
    publishedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$newHighlight = Invoke-RestMethod -Uri "http://localhost:3000/api/highlights" -Method POST -Body $highlightData -ContentType "application/json" -Headers $headers

# Update Highlight
$updateData = @{
    description = "Updated highlight description via PowerShell"
    tags = @("powershell", "testing", "amazing", "play", "updated")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/$($newHighlight._id)" -Method PUT -Body $updateData -ContentType "application/json" -Headers $headers

# Delete Highlight
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/$($newHighlight._id)" -Method DELETE -Headers $headers
```

#### 👤 Test Users (Admin Required)
```powershell
# Đăng nhập admin trước
$adminData = @{
    email = "admin@esport.com"
    password = "admin123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $adminData -ContentType "application/json"
$adminToken = $adminResponse.token

# Get All Users
$headers = @{
    "Authorization" = "Bearer $adminToken"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method GET -Headers $headers

# Get User by ID
Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011" -Method GET -Headers $headers

# Get Users by Role
Invoke-RestMethod -Uri "http://localhost:3000/api/users/role/user" -Method GET -Headers $headers

# Search Users
Invoke-RestMethod -Uri "http://localhost:3000/api/users/search?q=test" -Method GET -Headers $headers

# Get User Statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/users/stats" -Method GET -Headers $headers

# Get User Activity
Invoke-RestMethod -Uri "http://localhost:3000/api/users/activity" -Method GET -Headers $headers

# Update User Role
$roleData = @{
    role = "organizer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011/role" -Method PUT -Body $roleData -ContentType "application/json" -Headers $headers

# Deactivate User
Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011/deactivate" -Method PUT -Headers $headers

# Reactivate User
Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011/reactivate" -Method PUT -Headers $headers
```

#### 👑 Test Admin Functions
```powershell
# Sử dụng admin token từ bước trước
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

# System Statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/stats" -Method GET -Headers $headers

# User Management
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" -Method GET -Headers $headers

# Tournament Management
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/tournaments" -Method GET -Headers $headers

# News Management
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/news" -Method GET -Headers $headers

# Match Management
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/matches" -Method GET -Headers $headers

# Highlight Management
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/highlights" -Method GET -Headers $headers

# System Logs
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/logs" -Method GET -Headers $headers

# Database Status
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/database/status" -Method GET -Headers $headers

# System Health
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/health" -Method GET -Headers $headers

# Performance Metrics
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/performance" -Method GET -Headers $headers

# Security Logs
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/security/logs" -Method GET -Headers $headers

# Audit Trail
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/audit" -Method GET -Headers $headers

# System Settings
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/settings" -Method GET -Headers $headers

# Update System Settings
$settingsData = @{
    maintenanceMode = $false
    maxFileSize = 10485760
    allowedFileTypes = @("jpg", "png", "mp4", "avi")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/settings" -Method PUT -Body $settingsData -ContentType "application/json" -Headers $headers

# User Analytics
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/analytics/users" -Method GET -Headers $headers

# Tournament Analytics
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/analytics/tournaments" -Method GET -Headers $headers

# Content Analytics
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/analytics/content" -Method GET -Headers $headers

# System Notifications
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/notifications" -Method GET -Headers $headers

# Send System Notification
$notificationData = @{
    title = "PowerShell Test Notification"
    message = "This notification was sent via PowerShell testing"
    type = "info"
    recipients = @("all")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/notifications" -Method POST -Body $notificationData -ContentType "application/json" -Headers $headers
```

## 🔍 Test CRUD Operations

### Tạo Tournament Mới (Organizer Required)
```powershell
# Đăng nhập organizer
$organizerData = @{
    email = "organizer@esport.com"
    password = "organizer123"
} | ConvertTo-Json

$organizerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $organizerData -ContentType "application/json"
$organizerToken = $organizerResponse.token

# Tạo tournament mới
$tournamentData = @{
    name = "PowerShell Test Tournament"
    description = "Tournament created via PowerShell testing"
    game = "valorant"
    startDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endDate = (Get-Date).AddDays(37).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    maxParticipants = 16
    entryFee = 0
    prizePool = 1000
    status = "registration"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $organizerToken"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method POST -Body $tournamentData -ContentType "application/json" -Headers $headers
```

### Tạo News Mới (Admin Required)
```powershell
# Sử dụng admin token
$newsData = @{
    title = "PowerShell Testing News"
    content = "This news article was created via PowerShell testing"
    category = "testing"
    tags = @("powershell", "testing", "backend")
    status = "published"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/news" -Method POST -Body $newsData -ContentType "application/json" -Headers $headers
```

## 📊 Kiểm Tra Response

### Xem Response Chi Tiết
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method GET
$response | ConvertTo-Json -Depth 3

# Xem số lượng tournaments
$response.tournaments.Count

# Xem tournament đầu tiên
$response.tournaments[0]

# Xem các trường cụ thể
$response.tournaments | ForEach-Object { 
    [PSCustomObject]@{
        Name = $_.name
        Game = $_.game
        Status = $_.status
        StartDate = $_.startDate
    }
} | Format-Table -AutoSize
```

### Kiểm Tra Status Code
```powershell
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "✅ Success: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Error: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
}
```

### Kiểm Tra Response Time
```powershell
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method GET
    $stopwatch.Stop()
    Write-Host "✅ Response time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
} catch {
    $stopwatch.Stop()
    Write-Host "❌ Failed after: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Red
}
```

## 🚨 Xử Lý Lỗi

### Lỗi Network/Connection
```powershell
# Kiểm tra server có đang chạy không
Test-NetConnection -ComputerName localhost -Port 3000

# Kiểm tra process Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Kiểm tra port usage
netstat -an | findstr :3000

# Restart server nếu cần
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
Start-Sleep -Seconds 5
```

### Lỗi Authentication
```powershell
# Kiểm tra token có hợp lệ không
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers $headers
    Write-Host "✅ Token valid" -ForegroundColor Green
} catch {
    Write-Host "❌ Token invalid or expired" -ForegroundColor Red
    
    # Refresh token
    $loginData = @{
        email = "testuser@esport.com"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $response.token
    Write-Host "🔄 Token refreshed" -ForegroundColor Yellow
}
```

### Lỗi Validation
```powershell
# Test với dữ liệu không hợp lệ
$invalidData = @{
    email = "invalid-email"
    password = "123"  # Too short
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $invalidData -ContentType "application/json"
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorBody = $reader.ReadToEnd()
    Write-Host "❌ Validation Error: $errorBody" -ForegroundColor Red
}
```

## 📝 Ghi Log Test

### Lưu Output vào File
```powershell
# Chạy test và lưu output
.\test-functions.ps1 | Tee-Object -FilePath "test-output-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Hoặc redirect output
.\test-functions.ps1 > "test-output.txt" 2>&1

# Lưu với timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Output "[$timestamp] Test started" | Out-File -FilePath "test-log.txt" -Append
```

### Tạo Report
```powershell
$results = @()

# Test từng endpoint và lưu kết quả
$endpoints = @(
    "http://localhost:3000/api/health",
    "http://localhost:3000/api/tournaments",
    "http://localhost:3000/api/news",
    "http://localhost:3000/api/matches",
    "http://localhost:3000/api/highlights"
)

foreach ($endpoint in $endpoints) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method GET
        $stopwatch.Stop()
        $results += [PSCustomObject]@{
            Endpoint = $endpoint
            Status = "Success"
            ResponseTime = "$($stopwatch.ElapsedMilliseconds)ms"
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Response = $response
        }
    } catch {
        $stopwatch.Stop()
        $results += [PSCustomObject]@{
            Endpoint = $endpoint
            Status = "Failed"
            ResponseTime = "$($stopwatch.ElapsedMilliseconds)ms"
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Error = $_.Exception.Message
        }
    }
}

# Xuất report
$results | Export-Csv -Path "test-report.csv" -NoTypeInformation
$results | Format-Table -AutoSize

# Tạo summary
$successCount = ($results | Where-Object {$_.Status -eq "Success"}).Count
$totalCount = $results.Count
$successRate = [math]::Round(($successCount / $totalCount) * 100, 2)

Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $($totalCount - $successCount)" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor Yellow
```

## 🚀 Performance Testing

### Load Testing với PowerShell
```powershell
# Test response time với nhiều request
$endpoint = "http://localhost:3000/api/tournaments"
$iterations = 10
$responseTimes = @()

for ($i = 1; $i -le $iterations; $i++) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method GET
        $stopwatch.Stop()
        $responseTimes += $stopwatch.ElapsedMilliseconds
        Write-Host "Request $i`: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
    } catch {
        $stopwatch.Stop()
        Write-Host "Request $i`: Failed after $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 100  # Delay between requests
}

# Tính toán thống kê
$avgTime = [math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
$minTime = ($responseTimes | Measure-Object -Minimum).Minimum
$maxTime = ($responseTimes | Measure-Object -Maximum).Maximum

Write-Host "📈 Performance Summary:" -ForegroundColor Cyan
Write-Host "Average Response Time: ${avgTime}ms" -ForegroundColor White
Write-Host "Min Response Time: ${minTime}ms" -ForegroundColor Green
Write-Host "Max Response Time: ${maxTime}ms" -ForegroundColor Yellow
```

### Concurrent Testing
```powershell
# Test nhiều request đồng thời
$endpoint = "http://localhost:3000/api/health"
$concurrentRequests = 5

$jobs = @()
for ($i = 1; $i -le $concurrentRequests; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url)
        try {
            $response = Invoke-RestMethod -Uri $url -Method GET
            return @{Status = "Success"; Response = $response; JobId = $i}
        } catch {
            return @{Status = "Failed"; Error = $_.Exception.Message; JobId = $i}
        }
    } -ArgumentList $endpoint
}

# Chờ tất cả jobs hoàn thành
Wait-Job -Job $jobs

# Lấy kết quả
$results = $jobs | Receive-Job
$jobs | Remove-Job

$results | ForEach-Object {
    if ($_.Status -eq "Success") {
        Write-Host "Job $($_.JobId): ✅ Success" -ForegroundColor Green
    } else {
        Write-Host "Job $($_.JobId): ❌ Failed - $($_.Error)" -ForegroundColor Red
    }
}
```

## 🎯 Tips và Tricks

1. **Sử dụng Variables**: Lưu token vào biến để tái sử dụng
2. **Error Handling**: Luôn wrap trong try-catch để xử lý lỗi
3. **Headers**: Nhớ thêm Authorization header cho các endpoint yêu cầu auth
4. **JSON**: Sử dụng `ConvertTo-Json` để tạo request body
5. **Logging**: Lưu output để debug và phân tích
6. **Response Validation**: Kiểm tra cả status code và response content
7. **Performance Monitoring**: Sử dụng Stopwatch để đo response time
8. **Batch Operations**: Sử dụng Jobs để test concurrent requests
9. **Data Cleanup**: Luôn cleanup test data sau khi test
10. **Environment Variables**: Sử dụng biến môi trường cho URLs và credentials

## 🔄 Chạy Test Định Kỳ

### Tạo Scheduled Task
```powershell
# Tạo task chạy hàng ngày
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\test-functions.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 9AM
Register-ScheduledTask -TaskName "Backend Testing" -Action $action -Trigger $trigger

# Tạo task chạy mỗi giờ
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
Register-ScheduledTask -TaskName "Hourly Backend Testing" -Action $action -Trigger $trigger
```

### Chạy trong Background
```powershell
# Chạy test trong background
Start-Job -ScriptBlock { .\test-functions.ps1 } -Name "BackendTest"

# Kiểm tra status
Get-Job -Name "BackendTest"

# Lấy output
Receive-Job -Name "BackendTest"

# Dọn dẹp jobs
Get-Job | Remove-Job
```

### Continuous Testing
```powershell
# Chạy test liên tục với interval
while ($true) {
    Write-Host "🔄 Running tests at $(Get-Date)" -ForegroundColor Cyan
    
    try {
        .\test-functions.ps1
        Write-Host "✅ Tests completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tests failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "⏳ Waiting 1 hour before next test run..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3600  # 1 hour
}
```

## 🛠️ Troubleshooting

### Common Issues và Solutions

#### 0. PowerShell Output Hiển Thị Object Thay Vì Data Thực Tế

**Vấn đề:** Khi chạy `Invoke-RestMethod`, output hiển thị dạng `@{matches=System.Object[]; pagination=}` thay vì dữ liệu thực tế.

**Nguyên nhân:** PowerShell hiển thị metadata của object thay vì nội dung thực sự.

**Giải pháp:**

```powershell
# ❌ Cách sai - sẽ hiển thị object metadata
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method GET
$response  # Chỉ hiển thị: @{tournaments=System.Object[]; pagination=}

# ✅ Cách đúng - hiển thị data thực tế
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method GET

# Hiển thị toàn bộ response dạng JSON
$response | ConvertTo-Json -Depth 3

# Hiển thị chỉ data tournaments
$response.tournaments | Format-Table -AutoSize

# Hiển thị số lượng items
Write-Host "Total tournaments: $($response.tournaments.Count)"

# Hiển thị item đầu tiên
$response.tournaments[0] | Format-List

# Hiển thị properties cụ thể
$response.tournaments | Select-Object name, game, status, startDate | Format-Table -AutoSize
```

**Script sửa lỗi tự động:**
```powershell
# Chạy script này để test và hiển thị data đúng cách
.\fix-output.ps1

# Hoặc sử dụng script chi tiết
.\test-detailed.ps1 -TestType summary
```

**Tips để tránh lỗi này:**
1. Luôn sử dụng `ConvertTo-Json` để xem toàn bộ response
2. Sử dụng `Format-Table` và `Format-List` để hiển thị data
3. Truy cập trực tiếp vào properties: `$response.tournaments`
4. Kiểm tra type của response: `$response.GetType().Name`
5. Sử dụng `Select-Object` để chọn properties cần thiết

#### 1. Server Not Responding
```powershell
# Kiểm tra server status
Test-NetConnection -ComputerName localhost -Port 3000

# Restart server
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
Start-Sleep -Seconds 5
```

#### 2. Authentication Errors
```powershell
# Refresh token
$loginData = @{
    email = "admin@esport.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$adminToken = $response.token
```

#### 3. Database Connection Issues
```powershell
# Kiểm tra MongoDB
Test-NetConnection -ComputerName localhost -Port 27017

# Reinitialize database
npm run init-db
```

#### 4. PowerShell Execution Policy
```powershell
# Kiểm tra execution policy
Get-ExecutionPolicy

# Set execution policy nếu cần
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📚 Advanced Testing Scenarios

### 1. Stress Testing
```powershell
# Test với nhiều request liên tiếp
$endpoint = "http://localhost:3000/api/tournaments"
$maxRequests = 100
$successCount = 0
$failCount = 0

for ($i = 1; $i -le $maxRequests; $i++) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method GET
        $successCount++
        Write-Host "Request $i`: ✅ Success" -ForegroundColor Green
    } catch {
        $failCount++
        Write-Host "Request $i`: ❌ Failed" -ForegroundColor Red
    }
    
    if ($i % 10 -eq 0) {
        Write-Host "Progress: $i/$maxRequests (Success: $successCount, Failed: $failCount)" -ForegroundColor Cyan
    }
}

Write-Host "🎯 Stress Test Complete:" -ForegroundColor Cyan
Write-Host "Total Requests: $maxRequests" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
```

### 2. Data Integrity Testing
```powershell
# Test CRUD operations và verify data integrity
$testData = @{
    name = "Data Integrity Test Tournament"
    description = "Testing data consistency"
    game = "valorant"
    startDate = (Get-Date).AddDays(60).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endDate = (Get-Date).AddDays(67).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    maxParticipants = 8
    entryFee = 0
    prizePool = 500
    status = "registration"
} | ConvertTo-Json

# Create
$headers = @{ "Authorization" = "Bearer $organizerToken" }
$created = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method POST -Body $testData -ContentType "application/json" -Headers $headers

# Read và verify
$retrieved = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$($created._id)" -Method GET
if ($retrieved.name -eq $testData.name) {
    Write-Host "✅ Data integrity verified" -ForegroundColor Green
} else {
    Write-Host "❌ Data integrity check failed" -ForegroundColor Red
}

# Cleanup
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$($created._id)" -Method DELETE -Headers $headers
```

### 3. API Version Testing
```powershell
# Test different API versions nếu có
$versions = @("v1", "v2", "latest")
$baseUrl = "http://localhost:3000/api"

foreach ($version in $versions) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$version/health" -Method GET
        Write-Host "✅ Version $version`: Supported" -ForegroundColor Green
    } catch {
        Write-Host "❌ Version $version`: Not supported" -ForegroundColor Red
    }
}
```

---

**🎉 Bây giờ bạn có thể test toàn bộ backend bằng PowerShell một cách dễ dàng và chuyên nghiệp!**

**📋 Checklist Test:**
- [ ] Server khởi động thành công
- [ ] Database được khởi tạo
- [ ] Authentication endpoints hoạt động
- [ ] CRUD operations cho tất cả modules
- [ ] Admin functions hoạt động
- [ ] Error handling hoạt động đúng
- [ ] Performance testing hoàn thành
- [ ] Report được tạo thành công

**🚀 Next Steps:**
1. Chạy test suite hoàn chỉnh
2. Tạo automated testing schedule
3. Monitor performance metrics
4. Set up alerts cho failures
5. Document test results
