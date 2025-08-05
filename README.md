# Tournament Management System - Backend

Hệ thống quản lý giải đấu hoàn chỉnh được xây dựng với Node.js, Express.js, và MongoDB.

## 🚀 Tính năng

### Quản lý người dùng
- ✅ Đăng ký và đăng nhập với JWT authentication
- ✅ Phân quyền người dùng (user, organizer, admin)
- ✅ Quản lý profile cá nhân
- ✅ Đổi mật khẩu

### Quản lý giải đấu
- ✅ Tạo và quản lý giải đấu
- ✅ Đăng ký tham gia giải đấu
- ✅ Quản lý thí sinh (competitors)
- ✅ Theo dõi trạng thái giải đấu
- ✅ Hỗ trợ nhiều format giải đấu

### Quản lý trận đấu
- ✅ Tạo và lên lịch trận đấu
- ✅ Quản lý kết quả trận đấu
- ✅ Hỗ trợ format best-of-X
- ✅ Theo dõi thống kê

### Quản lý tin tức
- ✅ Tạo và xuất bản tin tức
- ✅ Bình luận và tương tác
- ✅ Tìm kiếm tin tức
- ✅ Tin tức nổi bật

### Quản lý highlight
- ✅ Quản lý video/hình ảnh highlight
- ✅ Tích hợp đa nền tảng
- ✅ Thống kê engagement
- ✅ Gắn thẻ và phân loại

## 🛠️ Công nghệ sử dụng

- **Backend Framework**: Node.js + Express.js
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Mongoose validators + custom validation
- **Environment Management**: dotenv
- **File Upload**: multer
- **CORS**: cors middleware

## 📁 Cấu trúc thư mục

```
src/backend/
├── config/
│   ├── config.js          # Cấu hình ứng dụng
│   └── database.js        # Kết nối MongoDB
├── controllers/
│   ├── AuthController.js      # Controller xác thực
│   ├── TournamentController.js # Controller giải đấu
│   ├── NewsController.js      # Controller tin tức
│   ├── MatchController.js     # Controller trận đấu
│   └── HighlightController.js # Controller highlight
├── middleware/
│   └── auth.js            # Middleware xác thực và phân quyền
├── models/
│   ├── User.js            # Model người dùng
│   ├── Tournament.js      # Model giải đấu
│   ├── Competitor.js      # Model thí sinh
│   ├── Match.js           # Model trận đấu
│   ├── News.js            # Model tin tức
│   └── Highlight.js       # Model highlight
├── routes/
│   ├── authRoutes.js      # Routes xác thực
│   ├── tournamentRoutes.js # Routes giải đấu
│   ├── newsRoutes.js      # Routes tin tức
│   ├── matchRoutes.js     # Routes trận đấu
│   └── highlightRoutes.js # Routes highlight
├── utils/
│   └── jwt.js             # Utilities JWT
├── .env                   # Biến môi trường
├── package.json           # Dependencies
└── server.js              # Entry point
```

## ⚙️ Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
cd src/backend
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục `src/backend/`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tournament_db
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Chạy MongoDB

Đảm bảo MongoDB đang chạy trên máy của bạn:

```bash
# Sử dụng Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc cài đặt MongoDB locally
mongod
```

### 4. Chạy server

```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register      # Đăng ký người dùng mới
POST /api/auth/login         # Đăng nhập
GET  /api/auth/profile       # Lấy thông tin profile (auth required)
PUT  /api/auth/profile       # Cập nhật profile (auth required)
PUT  /api/auth/change-password # Đổi mật khẩu (auth required)
POST /api/auth/logout        # Đăng xuất (auth required)
```

### Tournament Endpoints

```
GET    /api/tournaments                    # Lấy danh sách giải đấu
GET    /api/tournaments/upcoming           # Giải đấu sắp diễn ra
GET    /api/tournaments/ongoing            # Giải đấu đang diễn ra
GET    /api/tournaments/:id                # Lấy thông tin giải đấu
GET    /api/tournaments/:id/participants   # Danh sách thí sinh
POST   /api/tournaments                    # Tạo giải đấu (organizer/admin)
PUT    /api/tournaments/:id                # Cập nhật giải đấu (owner/admin)
DELETE /api/tournaments/:id                # Xóa giải đấu (owner/admin)
POST   /api/tournaments/:id/register       # Đăng ký tham gia (auth required)
DELETE /api/tournaments/:id/withdraw       # Rút khỏi giải đấu (auth required)
```

### Match Endpoints

```
GET  /api/matches                          # Danh sách trận đấu
GET  /api/matches/upcoming                 # Trận đấu sắp diễn ra
GET  /api/matches/ongoing                  # Trận đấu đang diễn ra
GET  /api/matches/:id                      # Thông tin trận đấu
POST /api/matches                          # Tạo trận đấu (organizer/admin)
PUT  /api/matches/:id/result               # Cập nhật kết quả (organizer/admin)
PUT  /api/matches/:id/start                # Bắt đầu trận đấu (organizer/admin)
```

### News Endpoints

```
GET  /api/news                             # Danh sách tin tức
GET  /api/news/featured                    # Tin tức nổi bật
GET  /api/news/:id                         # Chi tiết tin tức
POST /api/news                             # Tạo tin tức (organizer/admin)
PUT  /api/news/:id                         # Cập nhật tin tức (organizer/admin)
POST /api/news/:id/comment                 # Bình luận (auth required)
POST /api/news/:id/like                    # Like tin tức (auth required)
```

### Highlight Endpoints

```
GET  /api/highlights                       # Danh sách highlight
GET  /api/highlights/featured              # Highlight nổi bật
GET  /api/highlights/popular               # Highlight phổ biến
GET  /api/highlights/:id                   # Chi tiết highlight
POST /api/highlights                       # Tạo highlight (organizer/admin)
POST /api/highlights/:id/like              # Like highlight (auth required)
POST /api/highlights/:id/share             # Share highlight (auth required)
```

## 🔐 Authentication & Authorization

### JWT Token

API sử dụng JWT tokens để xác thực. Include token trong header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **user**: Người dùng thông thường
- **organizer**: Người tổ chức giải đấu
- **admin**: Quản trị viên hệ thống

## 📊 Database Schema

### User Model

```javascript
{
  email: String (unique, required),
  fullName: String (required),
  password: String (hashed, required),
  role: Enum ['user', 'organizer', 'admin'],
  avatar: String,
  favorites: [ObjectId], // Tournament IDs
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Tournament Model

```javascript
{
  name: String (required),
  format: Enum ['single-elimination', 'double-elimination', 'round-robin', 'swiss', 'league'],
  status: Enum ['upcoming', 'ongoing', 'completed', 'cancelled'],
  description: String (required),
  gameName: String (required),
  organizerId: ObjectId (User),
  startDate: Date (required),
  endDate: Date (required),
  maxPlayers: Number (required),
  currentPlayers: Number,
  registrationDeadline: Date,
  prizePool: Number,
  entryFee: Number,
  competitors: [ObjectId], // Competitor IDs
  matches: [ObjectId], // Match IDs
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error messages"] // Optional
}
```

## 🧪 Testing

```bash
# Chạy health check
curl http://localhost:3000/api/health

# Test đăng ký người dùng
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User","password":"123456"}'
```

## 🛡️ Security Features

- ✅ Password hashing với bcryptjs
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ CORS protection
- ✅ MongoDB injection protection

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db/tournament_db
JWT_SECRET=your-super-secret-production-key
JWT_EXPIRE=7d
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Lưu ý**: Đây là hệ thống backend hoàn chỉnh cho quản lý giải đấu. Hệ thống hỗ trợ tất cả các chức năng cần thiết từ quản lý người dùng, giải đấu, trận đấu đến tin tức và highlight.