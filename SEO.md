# Kế Hoạch & Từ Khóa SEO - CreatorHire

Tài liệu này lưu trữ danh sách từ khóa mục tiêu và chiến lược tối ưu hóa công cụ tìm kiếm (SEO) để đưa nền tảng **CreatorHire** lên Top Google tại Việt Nam.

---

## 1. Phân Nhóm Từ Khóa Mục Tiêu (Target Keywords)

Các từ khóa được chia làm 3 nhóm chính dựa trên đối tượng tìm kiếm: **Creator cần thuê**, **Freelancer tìm việc**, và **Tìm kiếm theo tính năng/ngách**.

### Nhóm 1: Creator tìm kiếm nhân sự (Từ khóa mang lại doanh thu)
Đây là nhóm từ khóa có mục đích tìm kiếm (Search Intent) cao nhất từ các YouTuber, TikToker, Agency cần thuê người.

| Từ khóa | Độ khó dự kiến | Intent | Gợi ý trang đích (Target Page) |
| :--- | :--- | :--- | :--- |
| `thuê video editor` | Trung bình - Cao | Giao dịch | Trang chủ / Trang danh sách Editor |
| `thuê video editor youtube` | Trung bình | Giao dịch | Danh mục: Video Editor -> YouTube |
| `thuê editor tik tok` | Trung bình | Giao dịch | Danh mục: Video Editor -> TikTok |
| `thuê viết kịch bản youtube` | Thấp - Trung bình| Giao dịch | Danh mục: Scriptwriter |
| `thuê thiết kế thumbnail` | Trung bình | Giao dịch | Danh mục: Thumbnail Designer |
| `dịch vụ edit video ngắn` | Trung bình | Giao dịch | Trang dịch vụ / Gói dịch vụ |
| `tìm người dựng video` | Trung bình | Tìm kiếm | Trang chủ / Đăng tin tuyển dụng |
| `thuê motion designer` | Thấp | Giao dịch | Danh mục: Motion Designer |

### Nhóm 2: Freelancer tìm kiếm dự án (Từ khóa thu hút nguồn cung)
Nhóm từ khóa này giúp thu hút các editor, designer tài năng đăng ký tài khoản trên nền tảng.

| Từ khóa | Độ khó dự kiến | Intent | Gợi ý trang đích (Target Page) |
| :--- | :--- | :--- | :--- |
| `tìm việc edit video tại nhà` | Trung bình | Tìm kiếm | Trang danh sách công việc (`/jobs`) |
| `việc làm video editor freelance`| Trung bình - Cao | Tìm kiếm | Trang danh sách công việc (`/jobs`) |
| `việc làm viết kịch bản online` | Thấp - Trung bình| Tìm kiếm | Trang danh sách công việc (`/jobs`) |
| `thiết kế thumbnail freelance` | Thấp | Tìm kiếm | Trang danh sách công việc (`/jobs`) |
| `việc làm freelance creative` | Trung bình | Tìm kiếm | Trang đăng ký nhận việc |

### Nhóm 3: Từ khóa ngách & Tính năng độc quyền (Long-tail Keywords)
Nhóm từ khóa này giúp tiếp cận khách hàng đang tìm kiếm giải pháp cho nỗi đau cụ thể (sợ bị bùng tiền, mệt mỏi khi sửa video nháp).

| Từ khóa | Độ khó dự kiến | Intent | Gợi ý trang đích (Target Page) |
| :--- | :--- | :--- | :--- |
| `giao dịch an toàn freelance` | Thấp | Tìm kiếm | Trang hướng dẫn Escrow (`/escrow`) |
| `công cụ duyệt video nháp online`| Thấp | Tìm kiếm | Bài viết blog / Landing page tính năng |
| `cách duyệt video bằng timestamp`| Thấp | Tìm kiếm | Bài viết blog / Hướng dẫn sử dụng |
| `bảo lãnh thanh toán freelance` | Thấp | Tìm kiếm | Trang hướng dẫn Escrow (`/escrow`) |

---

## 2. Bản Mẫu Meta Tags Tối Ưu Cho Từng Trang (On-page SEO)

Hãy cấu hình các thẻ meta này trong mã nguồn Next.js của bạn (ví dụ: `app/layout.tsx` hoặc các file `page.tsx` tương ứng).

### 2.1. Trang chủ (Home Page)
*   **Title**: `CreatorHire - Sàn Kết Nối Video Editor, Scriptwriter & Thumbnail Freelance`
*   **Meta Description**: `Nền tảng kết nối Content Creator với đội ngũ Video Editor, Scriptwriter và Thumbnail Designer hàng đầu Việt Nam. Giao dịch an toàn 100% qua PayOS Escrow & Duyệt nháp bằng Timestamp.`

### 2.2. Trang danh sách công việc (Jobs List - `/jobs`)
*   **Title**: `Tìm Việc Làm Video Editor Freelance, Kịch Bản & Thiết Kế Online | CreatorHire`
*   **Meta Description**: `Tổng hợp các dự án tuyển dụng Video Editor, thiết kế Thumbnail và viết kịch bản ngắn/dài hạn từ các kênh YouTube, TikTok triệu view. Nhận dự án và kiếm tiền ngay hôm nay.`

### 2.3. Trang danh sách Freelancer (Freelancers List - `/freelancers`)
*   **Title**: `Thuê Video Editor & Designer Chuyên Nghiệp | CreatorHire Việt Nam`
*   **Meta Description**: `Duyệt hồ sơ năng lực (portfolio) của hàng trăm freelancer dựng phim, thiết kế đồ họa và biên kịch xuất sắc. Thuê nhân sự chất lượng cao nhanh chóng và an toàn.`

---

## 3. Chiến Lược Thực Thi Kỹ Thuật (Technical SEO)

Để các trang con tự động leo top mà không cần viết tay từng trang, hãy áp dụng chiến lược **Programmatic SEO** thông qua cấu trúc Router của Next.js:

### 3.1. Cấu trúc URL thân thiện (Friendly URLs)
*   Thay vì dùng query parameter, hãy dùng cấu trúc động:
    *   `creatorhire.vn/freelancers/video-editor` (Danh mục Video Editor)
    *   `creatorhire.vn/freelancers/video-editor/premiere-pro` (Kỹ năng cụ thể)
    *   `creatorhire.vn/jobs/thiet-ke-thumbnail` (Danh mục công việc Thumbnail)

### 3.2. Cài đặt JSON-LD Schema (Dữ liệu có cấu trúc)
Để công cụ tìm kiếm hiểu cấu trúc trang web của bạn (giúp hiển thị dạng rich snippet):
1.  **Trang Job Detail (`/jobs/[id]`)**: Dùng `JobPosting` schema.
2.  **Trang Hồ sơ Freelancer (`/freelancers/[id]`)**: Dùng `ProfilePage` hoặc `Person` schema.
3.  **Toàn trang web**: Dùng `Organization` và `WebSite` schema.

*Ví dụ mã JSON-LD cho trang tuyển dụng (JobPosting):*
```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Tuyển Video Editor Freelance Kênh Tài Chính",
  "description": "Mô tả công việc dựng video ngắn cho kênh TikTok...",
  "datePosted": "2026-06-05",
  "validThrough": "2026-07-05",
  "employmentType": "CONTRACTOR",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "CreatorHire Client",
    "sameAs": "https://creatorhire.vn"
  },
  "jobLocationType": "TELECOMMUTE",
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "VND",
    "value": {
      "@type": "QuantitativeValue",
      "value": 5000000,
      "unitText": "MONTH"
    }
  }
}
```

---

## 4. Kế Hoạch Viết Bài Thu Hút Traffic (Content SEO)

Tạo một chuyên mục Blog (`/blog`) để viết bài nhắm vào các từ khóa thông tin (Informational keywords):
1.  *Chủ đề cho Creator*: "Cách viết kịch bản TikTok giữ chân người xem 3 giây đầu", "Kích thước và bố cục thiết kế Thumbnail YouTube chuẩn 2026 tăng CTR", "Bảng giá thuê video editor chuyên nghiệp hiện nay".
2.  *Chủ đề cho Freelancer*: "Làm thế nào để xây dựng Portfolio video editor cuốn hút", "Kinh nghiệm tránh bị bùng tiền khi làm freelance tại Việt Nam", "Hướng dẫn sử dụng các mốc thời gian (timestamp) để sửa video nhanh gấp đôi".
