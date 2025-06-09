# 🎮 Game Cờ Vây Online - GOKUU

## Giới thiệu đề tài

Đề tài: **Game Cờ Vây Online - GOKUU**

Đây là ứng dụng chơi cờ vây trực tuyến dành cho thiết bị di động.  
Người dùng có thể:

- Đăng ký, đăng nhập, quản lý tài khoản.
- Tham gia các phòng chơi online với người thật hoặc AI.
- Chat realtime trong trận đấu.
- Xem bảng xếp hạng ELO.
- Quản lý bạn bè và lịch sử trận đấu.
- Chơi trên Mobile App Gokuu (React Native), kết nối backend server.

---

## Giảng viên hướng dẫn & sinh viên thực hiện

**Giảng viên hướng dẫn:**  
Nguyễn Tấn Toàn

**Lớp:**  
SE346.P21

**Môn học:**  
Lập trình trên thiết bị di động

**Sinh viên thực hiện:**

- Trần Ngọc Phú - 22521107
- Lê Quang Phúc - 22521118
- Trương Đắc Điền - 22520248
- Đặng Lê Bình - 22520128

---

## Công nghệ sử dụng

### Backend (BE):

- **Node.js**
- **Express.js**
- **MongoDB** (qua Mongoose ODM)
- **WebSocket** (Realtime server - Socket.io)
- **JWT** (JSON Web Token) cho bảo mật phiên đăng nhập
- **bcrypt** cho bảo mật mật khẩu
- **Cloudinary** cho lưu trữ ảnh tĩnh (avatar, ảnh chat)
- **Ngrok** phục vụ tạm thời cho testing.

### Frontend:

- **React Native** (Mobile App Gokuu)

---

## Cách chạy project Backend (BE)

### Yêu cầu:

- Cài đặt **Node.js** >= v16
- Cài đặt **npm**

### Các bước thực hiện:

```bash
# Clone source về
git clone <repo_url>

# Cài đặt các dependencies
npm install

# Chạy server (dev mode)
npm run dev
```
