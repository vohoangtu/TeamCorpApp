# WinDev Hub (Windows 11 Local Orchestrator & Hot-Sync)

Ứng dụng quản lý vòng đời phát triển và triển khai local các ứng dụng trên Windows 11 với cơ chế **Trigger Sync** siêu tốc, được xây dựng theo chuẩn công nghệ hiện đại **cuối năm 2026**:
- **Frontend UI:** **React 19** + **Tailwind CSS v4** (CSS-first, Rust Oxide Engine) + **Vite 6** + **TypeScript 5.8** + **Zustand v5** + **Lucide Icons**.
- **Backend Orchestrator:** **Node.js v24** + WebSocket streaming + Windows Process Tree Management (`tree-kill`) + Docker Engine integration + Git Engine (`isomorphic-git`).

---

## 🌟 Tính năng chính

1. **Quản lý Vòng đời Nhiều Dự án (Multi-App Lifecycle):**
   - Hỗ trợ quản lý song song nhiều app (Node.js, Python FastAPI/Django, Go, Rust, Java, Docker Compose).
   - Start, Stop, Restart, Health-check, đo lường PID, thời gian phản hồi.
   - Stream logs (stdout/stderr) thời gian thực với màu sắc ANSI qua WebSocket.
   - Dọn sạch 100% tiến trình con trên Windows (`taskkill /T /F`), không bao giờ bị treo hoặc chiếm dụng port khi tắt app.

2. **Cơ chế Trigger Sync (Hot-Deploy tức thì):**
   - Lập trình viên code tính năng trong thư mục dự án trên Windows.
   - Khi có thay đổi, nhấn nút **"TRIGGER SYNC"** (hoặc bật chế độ **Auto-sync on save**).
   - Hệ thống tự động chạy build pipeline (nếu có), khởi động lại runtime trong vài chục millisecond và thông báo kết quả.

3. **Nguồn Dự án Linh hoạt (Project Sources):**
   - **Local Folder:** Trỏ trực tiếp đến thư mục trên ổ đĩa Windows (tự động nhận diện loại dự án và câu lệnh khởi chạy tối ưu).
   - **GitHub / GitLab:** Nhập link repository + Branch + Personal Access Token (PAT) để tự động clone về workspace local.

4. **Hỗ trợ Đồng thời Cả Hai Mô hình Runtime:**
   - **Native Process:** Khởi chạy trực tiếp các lệnh CLI (`npm run dev`, `uvicorn main:app`, `go run .`, `cargo run`).
   - **Docker Containers:** Tự động gọi Docker Compose (`docker compose up`, `docker compose restart`, `docker compose down`).

---

## 🚀 Hướng dẫn khởi chạy

### 1. Khởi động ứng dụng
Mở terminal tại thư mục dự án:
```powershell
cd C:\Users\vohoa\.gemini\antigravity\scratch\windev-hub
npm.cmd run dev
```

### 2. Truy cập Dashboard
Mở trình duyệt:
- **Web Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSocket:** [http://localhost:4100](http://localhost:4100)
