# Tournament Management System - Backend

Backend quản lý giải đấu bằng Node.js, Express, MongoDB. Tài liệu này liệt kê lệnh cURL tương ứng với từng chức năng và output mong muốn (đã điều chỉnh khớp với schema model hiện tại của project).

## ⚙️ Cài đặt & Chạy

1) Cài dependencies (tại thư mục gốc repo)

```bash
npm install
```

2) Tạo `.env`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tournament_db
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

3) Chạy MongoDB (Docker hoặc local)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
# hoặc
mongod
```

4) Chạy server

```bash
npm run dev
# hoặc production
npm start
```

Health check: `GET http://localhost:3000/api/health`

Header xác thực khi cần:

```
Authorization: Bearer <token>
```

Role: `user`, `organizer`, `admin`.

## 🔐 Authentication

### Đăng ký

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"user@example.com","fullName":"User","password":"123456","role":"organizer"}'
```

Output mong muốn:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "<userId>",
      "email": "user@example.com",
      "fullName": "User",
      "role": "organizer",
      "avatarUrl": null,
      "createdAt": "<iso>",
      "updatedAt": "<iso>"
    },
    "token": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

### Đăng nhập

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"user@example.com","password":"123456"}'
```

Output mong muốn: giống đăng ký (trả về `user`, `token`, `refreshToken`).

### Lấy/Cập nhật hồ sơ, Đổi mật khẩu

```powershell
# Lấy hồ sơ
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers @{"Authorization"="Bearer <token>"}

# Cập nhật hồ sơ
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"fullName":"New Name","avatarUrl":"https://..."}'

# Đổi mật khẩu
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/change-password" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"currentPassword":"123456","newPassword":"654321"}'
```

Output mong muốn (ví dụ cập nhật):

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "user": { "_id": "<userId>", "fullName": "New Name", "avatarUrl": "https://..." } }
}
```

## 🏆 Tournaments

Model hiện có: `name`, `gameName`, `format`, `description`, `organizerId`, `competitor` (mảng ObjectId), `avatarUrl`, `startDate`, `endDate`, `status` (upcoming|ongoing|completed), `numberOfPlayers`, `maxPlayers`.

### Tạo giải (organizer/admin)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"name":"Summer Cup","gameName":"Valorant","format":"single-elimination","description":"...","avatarUrl":"https://...","startDate":"2025-09-01","endDate":"2025-09-30","maxPlayers":16}'
```

Output mong muốn:

```json
{
  "success": true,
  "message": "Tournament created successfully",
  "data": { "tournament": { "_id": "<id>", "name": "Summer Cup", "organizerId": { "_id": "<uid>", "fullName": "..." } } }
}
```

### Danh sách / Chi tiết

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments?page=1&limit=10&status=upcoming&search=summer" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>" -Method GET
```

Output mong muốn (list):

```json
{
  "success": true,
  "data": {
    "tournaments": [ { "_id": "<id>", "name": "..." } ],
    "pagination": { "current": 1, "pages": 1, "total": 1 }
  }
}
```

### Người tham gia, Đăng ký/Rút

```powershell
# Danh sách thí sinh
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>/participants" -Method GET

# Đăng ký tham gia (auth)
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>/register" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"name":"My Team","logoUrl":"https://...","description":"...","mail":"team@example.com"}'

# Rút khỏi giải (auth) — yêu cầu competitorId
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>/withdraw" -Method DELETE -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"competitorId":"<competitorId>"}'
```

Output mong muốn (đăng ký):

```json
{
  "success": true,
  "message": "Successfully registered for tournament",
  "data": { "competitor": { "_id": "<cid>", "name": "My Team" }, "tournament": { "_id": "<id>" } }
}
```

### Cập nhật/Xóa/Trạng thái

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"description":"Updated"}'

Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>" -Method DELETE -Headers @{"Authorization"="Bearer <token>"}

Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/<id>/status" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"status":"ongoing"}'
```

Output mong muốn (trạng thái):

```json
{ "success": true, "message": "Tournament status updated successfully", "data": { "tournament": { "_id": "<id>", "status": "ongoing" } } }
```

### Upcoming / Ongoing

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/upcoming" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/ongoing" -Method GET
```

## 🥊 Matches

Model hiện có: `tournamentId`, `teamA`, `teamB`, `scheduledAt`, `score.{a,b}`, `status` (pending|done).

### Tạo trận (organizer/admin)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/matches" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"tournamentId":"<tid>","teamA":"<cidA>","teamB":"<cidB>","scheduledAt":"2025-09-02T10:00:00Z"}'
```

Output mong muốn:

```json
{ "success": true, "message": "Match created successfully", "data": { "match": { "_id": "<mid>", "teamA": {"_id":"<cidA>","name":"..."} } } }
```

### Danh sách / Chi tiết

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/matches?page=1&limit=10&tournamentId=<tid>&status=pending" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/<mid>" -Method GET
```

### Bắt đầu, Kết quả, Dời lịch

```powershell
# Bắt đầu
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/<mid>/start" -Method PUT -Headers @{"Authorization"="Bearer <token>"}

# Cập nhật kết quả
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/<mid>/result" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"scoreA":2,"scoreB":1}'

# Dời lịch
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/<mid>/reschedule" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"newDate":"2025-09-03T10:00:00Z"}'
```

Output mong muốn (kết quả):

```json
{ "success": true, "message": "Match result set successfully", "data": { "match": { "_id": "<mid>", "score": {"a":2,"b":1}, "status": "done" } } }
```

### Theo giải/đội, Upcoming/Ongoing

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/tournament/<tid>?page=1&limit=20" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/competitor/<cid>" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/upcoming" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/matches/ongoing" -Method GET
```

Lưu ý: các route `addGame`, `cancel`, `postpone` hiện không hỗ trợ (trả 400).

## 📰 News

Model hiện có: `tournamentId`, `title`, `content`, `images`, `authorId`, `publishedAt`, `status` (private|public).

```powershell
# Tạo (organizer/admin)
Invoke-RestMethod -Uri "http://localhost:3000/api/news" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"title":"New","content":"...","tournamentId":"<tid>","images":["https://..."]}'

# Danh sách public
Invoke-RestMethod -Uri "http://localhost:3000/api/news?page=1&limit=10&search=new" -Method GET

# Chi tiết
Invoke-RestMethod -Uri "http://localhost:3000/api/news/<nid>" -Method GET

# Cập nhật/Xóa (organizer/admin)
Invoke-RestMethod -Uri "http://localhost:3000/api/news/<nid>" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"title":"Updated"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/news/<nid>" -Method DELETE -Headers @{"Authorization"="Bearer <token>"}

# Xuất bản (organizer/admin)
Invoke-RestMethod -Uri "http://localhost:3000/api/news/<nid>/publish" -Method PUT -Headers @{"Authorization"="Bearer <token>"}

# Theo giải/featured/tìm kiếm/author
Invoke-RestMethod -Uri "http://localhost:3000/api/news/tournament/<tid>?page=1&limit=10" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/news/featured?limit=5" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/news/search?q=new&page=1&limit=10" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/news/author/<uid>?page=1&limit=10" -Method GET
```

Output mong muốn (publish):

```json
{ "success": true, "message": "News article published successfully", "data": { "news": { "_id": "<nid>", "status": "public" } } }
```

Lưu ý: `comment`, `like` chưa hỗ trợ (trả 400).

## 🎬 Highlights

Model hiện có: `tournamentId`, `matchId`, `title`, `videoUrl`, `description`, `status` (private|public).

```powershell
# Tạo (organizer/admin)
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"title":"Epic","description":"...","videoUrl":"https://...","tournamentId":"<tid>","matchId":"<mid>","status":"public"}'

# Danh sách public / Chi tiết
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights?page=1&limit=10&search=epic" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/<hid>" -Method GET

# Cập nhật/Xóa/Trạng thái (organizer/admin)
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/<hid>" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"title":"Updated"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/<hid>" -Method DELETE -Headers @{"Authorization"="Bearer <token>"}
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/<hid>/status" -Method PUT -ContentType "application/json" -Headers @{"Authorization"="Bearer <token>"} -Body '{"status":"private"}'

# Theo giải / Theo trận / Featured / Popular / Search
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/tournament/<tid>?page=1&limit=10" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/match/<mid>" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/featured?limit=5" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/popular?limit=10" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/api/highlights/search?q=epic&page=1&limit=10" -Method GET
```

Output mong muốn (status):

```json
{ "success": true, "message": "Highlight status updated successfully", "data": { "highlight": { "_id": "<hid>", "status": "private" } } }
```

Lưu ý: `like`, `share`, `featured`, `attach-match`, `type` filter hiện chưa hỗ trợ (trả 400 nếu gọi các route này).

## 📦 Định dạng response chuẩn

```json
{ "success": true, "message": "...", "data": { /* tuỳ endpoint */ } }
```

Khi lỗi:

```json
{ "success": false, "message": "<lý do>" }
```

## 📝 Ghi chú

- Nếu gặp lỗi `Cannot find module 'express'`, hãy chạy `npm install` trước khi `npm run dev`.
- Trên Windows PowerShell không cần dùng `| cat` để xem log.
- Windows PowerShell dùng `Invoke-RestMethod` thay vì `curl`.
- Thay `<token>`, `<id>`, `<tid>`, `<mid>`, `<nid>`, `<hid>`, `<cid>` bằng giá trị thực tế.