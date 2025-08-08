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

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","fullName":"User","password":"123456","role":"organizer"}'
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

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

Output mong muốn: giống đăng ký (trả về `user`, `token`, `refreshToken`).

### Lấy/Cập nhật hồ sơ, Đổi mật khẩu

```bash
# Lấy hồ sơ
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"

# Cập nhật hồ sơ
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"fullName":"New Name","avatarUrl":"https://..."}'

# Đổi mật khẩu
curl -X PUT http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"currentPassword":"123456","newPassword":"654321"}'
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

```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name":"Summer Cup","gameName":"Valorant","format":"single-elimination","description":"...","avatarUrl":"https://...","startDate":"2025-09-01","endDate":"2025-09-30","maxPlayers":16}'
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

```bash
curl "http://localhost:3000/api/tournaments?page=1&limit=10&status=upcoming&search=summer"
curl http://localhost:3000/api/tournaments/<id>
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

```bash
# Danh sách thí sinh
curl http://localhost:3000/api/tournaments/<id>/participants

# Đăng ký tham gia (auth)
curl -X POST http://localhost:3000/api/tournaments/<id>/register \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name":"My Team","logoUrl":"https://...","description":"...","mail":"team@example.com"}'

# Rút khỏi giải (auth) — yêu cầu competitorId
curl -X DELETE http://localhost:3000/api/tournaments/<id>/withdraw \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"competitorId":"<competitorId>"}'
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

```bash
curl -X PUT http://localhost:3000/api/tournaments/<id> \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"description":"Updated"}'

curl -X DELETE http://localhost:3000/api/tournaments/<id> \
  -H "Authorization: Bearer <token)"

curl -X PUT http://localhost:3000/api/tournaments/<id>/status \
  -H "Authorization: Bearer <token)" -H "Content-Type: application/json" \
  -d '{"status":"ongoing"}'
```

Output mong muốn (trạng thái):

```json
{ "success": true, "message": "Tournament status updated successfully", "data": { "tournament": { "_id": "<id>", "status": "ongoing" } } }
```

### Upcoming / Ongoing

```bash
curl http://localhost:3000/api/tournaments/upcoming
curl http://localhost:3000/api/tournaments/ongoing
```

## 🥊 Matches

Model hiện có: `tournamentId`, `teamA`, `teamB`, `scheduledAt`, `score.{a,b}`, `status` (pending|done).

### Tạo trận (organizer/admin)

```bash
curl -X POST http://localhost:3000/api/matches \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"tournamentId":"<tid>","teamA":"<cidA>","teamB":"<cidB>","scheduledAt":"2025-09-02T10:00:00Z"}'
```

Output mong muốn:

```json
{ "success": true, "message": "Match created successfully", "data": { "match": { "_id": "<mid>", "teamA": {"_id":"<cidA>","name":"..."} } } }
```

### Danh sách / Chi tiết

```bash
curl "http://localhost:3000/api/matches?page=1&limit=10&tournamentId=<tid>&status=pending"
curl http://localhost:3000/api/matches/<mid>
```

### Bắt đầu, Kết quả, Dời lịch

```bash
# Bắt đầu
curl -X PUT http://localhost:3000/api/matches/<mid>/start -H "Authorization: Bearer <token>"

# Cập nhật kết quả
curl -X PUT http://localhost:3000/api/matches/<mid>/result \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"scoreA":2,"scoreB":1}'

# Dời lịch
curl -X PUT http://localhost:3000/api/matches/<mid>/reschedule \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"newDate":"2025-09-03T10:00:00Z"}'
```

Output mong muốn (kết quả):

```json
{ "success": true, "message": "Match result set successfully", "data": { "match": { "_id": "<mid>", "score": {"a":2,"b":1}, "status": "done" } } }
```

### Theo giải/đội, Upcoming/Ongoing

```bash
curl "http://localhost:3000/api/matches/tournament/<tid>?page=1&limit=20"
curl http://localhost:3000/api/matches/competitor/<cid>
curl http://localhost:3000/api/matches/upcoming
curl http://localhost:3000/api/matches/ongoing
```

Lưu ý: các route `addGame`, `cancel`, `postpone` hiện không hỗ trợ (trả 400).

## 📰 News

Model hiện có: `tournamentId`, `title`, `content`, `images`, `authorId`, `publishedAt`, `status` (private|public).

```bash
# Tạo (organizer/admin)
curl -X POST http://localhost:3000/api/news \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"title":"New","content":"...","tournamentId":"<tid>","images":["https://..."]}'

# Danh sách public
curl "http://localhost:3000/api/news?page=1&limit=10&search=new"

# Chi tiết
curl http://localhost:3000/api/news/<nid>

# Cập nhật/Xóa (organizer/admin)
curl -X PUT http://localhost:3000/api/news/<nid> -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"Updated"}'
curl -X DELETE http://localhost:3000/api/news/<nid> -H "Authorization: Bearer <token)"

# Xuất bản (organizer/admin)
curl -X PUT http://localhost:3000/api/news/<nid>/publish -H "Authorization: Bearer <token)"

# Theo giải/featured/tìm kiếm/author
curl "http://localhost:3000/api/news/tournament/<tid>?page=1&limit=10"
curl "http://localhost:3000/api/news/featured?limit=5"
curl "http://localhost:3000/api/news/search?q=new&page=1&limit=10"
curl "http://localhost:3000/api/news/author/<uid>?page=1&limit=10"
```

Output mong muốn (publish):

```json
{ "success": true, "message": "News article published successfully", "data": { "news": { "_id": "<nid>", "status": "public" } } }
```

Lưu ý: `comment`, `like` chưa hỗ trợ (trả 400).

## 🎬 Highlights

Model hiện có: `tournamentId`, `matchId`, `title`, `videoUrl`, `description`, `status` (private|public).

```bash
# Tạo (organizer/admin)
curl -X POST http://localhost:3000/api/highlights \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"title":"Epic","description":"...","videoUrl":"https://...","tournamentId":"<tid>","matchId":"<mid>","status":"public"}'

# Danh sách public / Chi tiết
curl "http://localhost:3000/api/highlights?page=1&limit=10&search=epic"
curl http://localhost:3000/api/highlights/<hid>

# Cập nhật/Xóa/Trạng thái (organizer/admin)
curl -X PUT http://localhost:3000/api/highlights/<hid> -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"Updated"}'
curl -X DELETE http://localhost:3000/api/highlights/<hid> -H "Authorization: Bearer <token)"
curl -X PUT http://localhost:3000/api/highlights/<hid>/status -H "Authorization: Bearer <token)" -H "Content-Type: application/json" -d '{"status":"private"}'

# Theo giải / Theo trận / Featured / Popular / Search
curl "http://localhost:3000/api/highlights/tournament/<tid>?page=1&limit=10"
curl http://localhost:3000/api/highlights/match/<mid>
curl "http://localhost:3000/api/highlights/featured?limit=5"
curl "http://localhost:3000/api/highlights/popular?limit=10"
curl "http://localhost:3000/api/highlights/search?q=epic&page=1&limit=10"
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