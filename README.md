# 🏡 Homers Frontend - Nền tảng Tìm kiếm & Thuê phòng trọ thông minh

Giao diện người dùng (Frontend Web Application) hiện đại, tối ưu trải nghiệm cho nền tảng **Homers (Rent Finder)** — hệ thống tìm kiếm phòng trọ, căn hộ, nhà nguyên căn, kết nối người thuê với chủ nhà, hỗ trợ quản lý hợp đồng số và trò chuyện thời gian thực.

Dự án được xây dựng bằng **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, kết nối thời gian thực qua **Socket.IO** và giao tiếp với hệ thống **NestJS Backend**. Giao diện được thiết kế theo phong cách **Warm Minimalism / Humanist Design** ấm áp, trang nhã, lấy người dùng làm trung tâm.

---

## 📑 Mục lục
- [1. Công nghệ sử dụng (Tech Stack)](#-1-công-nghệ-sử-dụng-tech-stack)
- [2. Ngôn ngữ thiết kế & Trải nghiệm (Design System & UI/UX)](#-2-ngôn-ngữ-thiết-kế--trải-nghiệm-design-system--uiux)
- [3. Cấu trúc thư mục dự án (Project Structure)](#-3-cấu-trúc-thư-mục-dự-án-project-structure)
- [4. Các tính năng & Màn hình chính (Key Features & Pages)](#-4-các-tính-năng--màn-hình-chính-key-features--pages)
  - [Bảng tin khám phá & Tìm kiếm (Home Feed)](#41-bảng-tin-khám-phá--tìm-kiếm-home-feed)
  - [Xác thực tài khoản (Authentication)](#42-xác-thực-tài-khoản-authentication)
  - [Đăng tin phòng trọ / Bất động sản (Create Listing)](#43-đăng-tin-phòng-trọ--bất-động-sản-create-listing)
  - [Chi tiết bài đăng (Listing Detail)](#44-chi-tiết-bài-đăng-listing-detail)
  - [Quản lý tin đăng của tôi (My Listings & AI Status)](#45-quản-lý-tin-đăng-của-tôi-my-listings--ai-status)
  - [Tin đã lưu & Yêu thích (Favorites)](#46-tin-đã-lưu--yêu-thích-favorites)
  - [Trò chuyện thời gian thực (Realtime Chat & Contract)](#47-trò-chuyện-thời-gian-thực-realtime-chat--contract)
  - [Diễn đàn tìm trọ & bạn ở ghép (Forum Community)](#48-diễn-đàn-tìm-trọ--bạn-ở-ghép-forum-community)
  - [Hồ sơ cá nhân (User Profile)](#49-hồ-sơ-cá-nhân-user-profile)
  - [Trung tâm thông báo (Notifications Center)](#410-trung-tâm-thông-báo-notifications-center)
- [5. Tích hợp Backend & Sự kiện Realtime (Socket.IO)](#-5-tích-hợp-backend--sự-kiện-realtime-socketio)
- [6. Yêu cầu hệ thống & Cài đặt (Prerequisites & Installation)](#-6-yêu-cầu-hệ-thống--cài-đặt-prerequisites--installation)
- [7. Cấu hình biến môi trường (.env.local)](#-7-cấu-hình-biến-môi-trường-envlocal)
- [8. Hướng dẫn khởi chạy (Run & Scripts)](#-8-hướng-dẫn-khởi-chạy-run--scripts)

---

## 🛠 1. Công nghệ sử dụng (Tech Stack)

| Lĩnh vực | Công nghệ / Thư viện | Phiên bản | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `16.3.6` | Kiến trúc App Router, Server/Client Components, tối ưu SEO và routing |
| **Thư viện UI** | [React](https://react.dev/) | `19.2.8` | Xây dựng giao diện phản ứng nhanh với React hooks, memoization |
| **Ngôn ngữ** | [TypeScript](https://www.typescriptlang.org/) | `5.x` | Đảm bảo tính an toàn kiểu dữ liệu cho DTO, model và component props |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `^4.0` | Động cơ CSS mới nhất thông qua `@tailwindcss/postcss`, khai báo theme CSS biến động |
| **Giao tiếp Realtime** | [Socket.io-client](https://socket.io/docs/v4/client-api/) | `^4.8.4` | Kết nối WebSocket nhận tin nhắn, thông báo, gõ phím và biến động trạng thái bài đăng |
| **Font chữ** | `next/font/google` | - | Nhúng phông **Be Vietnam Pro** chuẩn hóa hiển thị tiếng Việt mượt mà |
| **Biểu tượng (Icons)** | Google Material Symbols | - | Bộ icon vector trực quan, đồng bộ trải nghiệm di động và máy tính |
| **Network & Auth** | Fetch API, `google-auth-library` | - | Gọi REST API backend kèm xử lý Bearer Token và hỗ trợ OAuth |

---

## 🎨 2. Ngôn ngữ thiết kế & Trải nghiệm (Design System & UI/UX)

Homers được định hình với ngôn ngữ thẩm mỹ riêng biệt lấy cảm hứng từ phong cách **Warm Minimalism** (tối giản ấm áp) nhằm đem lại cảm giác an tâm, thân thiện và gần gũi cho người đi tìm chốn an cư:

- **Bảng màu ấm áp (Warm Parchment Palette):**
  - **Màu nền (Surface / Parchment):** `#fcf9f2` & `#f7f4ed` — sắc kem dịu mắt, tránh sự lạnh lẽo của nền trắng tinh.
  - **Màu chữ (Charcoal Ink):** `#1c1c1c` — đen than chì hữu cơ, độ tương phản sắc nét nhưng không gây mỏi mắt.
  - **Màu nhấn (Warm Accent):** `#d97706` (Amber) — làm nổi bật các huy hiệu thông báo, badge tin chưa đọc, nút quan trọng.
  - **Màu phân cách (Borders & Dividers):** `#eceae4` tinh tế, kết hợp bo góc tròn mềm mại (`rounded-xl`, `rounded-2xl`, `rounded-full`).
- **Typography:** Phông chữ chủ đạo **Be Vietnam Pro** với các cấp độ từ Regular (400), Medium (500) đến SemiBold/Bold (600/700), căn chỉnh tỉ lệ khoảng cách dòng (line-height) thoải mái cho việc đọc mô tả phòng trọ.
- **Điều hướng Sidebar phong cách Instagram:** Thanh sidebar cố định bên trái (Desktop hiển thị đầy đủ nhãn văn bản, Tablet/Mobile tự động thu gọn về dạng icon trực quan), tích hợp badge đếm tin nhắn và thông báo chưa đọc theo thời gian thực.
- **Trạng thái tải (Skeleton Loading):** Toàn bộ các trang từ Feed, Chi tiết bài đăng, Tin nhắn đến Hồ sơ cá nhân đều có khung Skeleton mô phỏng nội dung giúp tránh hiện tượng giật layout (CLS).

---

## 📂 3. Cấu trúc thư mục dự án (Project Structure)

```text
stitch_real_estate_rental_app/
├── public/                     # Tài nguyên tĩnh: logo.svg, favicon.svg, hình ảnh minh họa
├── src/
│   ├── app/                    # Next.js App Router (Định tuyến theo thư mục)
│   │   ├── (auth)/             # Nhóm route xác thực
│   │   │   └── login/page.tsx  # Trang Đăng nhập / Đăng ký (Phone, Password, Google, Facebook)
│   │   ├── create-listing/     # Trang đăng tin cho thuê / bán mới (Form đa bước + Upload ảnh)
│   │   ├── favorites/          # Trang danh sách bài đăng đã thả tim / quan tâm
│   │   ├── forum/              # Diễn đàn cộng đồng tìm trọ và tìm bạn ở ghép
│   │   ├── listings/[id]/      # Chi tiết bài đăng bất động sản (Gallery, tiện ích, chat chủ nhà)
│   │   ├── messages/           # Hệ thống trò chuyện thời gian thực (Chat 1-1 & Nhóm Hợp đồng)
│   │   ├── my-listings/        # Quản lý tin đăng cá nhân & Theo dõi trạng thái duyệt AI
│   │   ├── profile/            # Trang thông tin cá nhân & Quản lý hợp đồng của tôi
│   │   │   └── [id]/           # Trang xem hồ sơ công khai của người dùng khác
│   │   ├── globals.css         # Khai báo Tailwind CSS v4, bảng màu theme, typography tokens
│   │   ├── layout.tsx          # Root Layout (Bọc AppShell, nạp font Be Vietnam Pro, Google Icons)
│   │   └── page.tsx            # Trang chủ: Feed danh sách bài đăng, tìm kiếm, FilterModal
│   ├── components/             # Các thành phần giao diện dùng chung
│   │   ├── ui/                 # Thư viện component nguyên tử (Button, Input, CurrencyInput, Skeleton)
│   │   ├── AppShell.tsx        # Khung bao bọc layout chính tích hợp SidebarNavigation
│   │   ├── BottomNavigation.tsx# Thanh điều hướng chân trang trên thiết bị di động
│   │   ├── ChatSettingsModal.tsx # Hộp thoại quản lý nhóm chat, đổi tên, lưu trữ cuộc trò chuyện
│   │   ├── FilterModal.tsx     # Modal bộ lọc chuyên sâu (giá, diện tích, tiện ích, vị trí)
│   │   ├── Header.tsx          # Thanh điều hướng đầu trang (chuông thông báo, avatar)
│   │   ├── ListingCard.tsx     # Thẻ bài đăng phòng trọ (ảnh đại diện, giá VND, nút thả tim)
│   │   ├── ListingInterestsModal.tsx # Modal xem danh sách người đã quan tâm tin đăng
│   │   ├── NotificationModal.tsx    # Modal danh sách thông báo thời gian thực
│   │   └── SidebarNavigation.tsx    # Sidebar điều hướng cạnh trái phong cách Instagram
│   └── lib/
│       └── socket.ts           # Quản lý kết nối Socket.IO Client (Singleton pattern, auto-reconnect)
├── .env.local                  # Cấu hình biến môi trường cục bộ
├── next.config.ts              # Cấu hình Next.js compiler
├── package.json                # Danh sách dependencies và npm scripts
├── postcss.config.mjs          # Cấu hình PostCSS với Tailwind v4
├── PRD.md                      # Tài liệu đặc tả yêu cầu và hệ thống thiết kế
└── tsconfig.json               # Cấu hình TypeScript compiler
```

---

## 🌟 4. Các tính năng & Màn hình chính (Key Features & Pages)

### 4.1. Bảng tin khám phá & Tìm kiếm (`/`)
- **Feed thông minh:** Hiển thị danh sách phòng trọ/nhà ở được sắp xếp ưu tiên theo vị trí thành phố của người dùng, bài đăng mới và điểm quan tâm (`interestScore`).
- **Thanh tìm kiếm tức thì:** Tìm kiếm theo từ khóa trong tiêu đề và mô tả, hỗ trợ shortcut tự động focus từ sidebar.
- **Pills lọc nhanh:** Chọn nhanh loại hình: *Tất cả, Căn hộ / Chung cư, Nhà riêng / Nguyên căn, Phòng trọ / Studio, Mặt bằng / Văn phòng, Đất*.
- **Bộ lọc nâng cao (Filter Modal):**
  - Lọc theo địa giới: Tỉnh/Thành phố $\rightarrow$ Quận/Huyện $\rightarrow$ Phường/Xã (Cascade API).
  - Lọc theo hình thức: Thuê (`RENT`) hoặc Mua bán (`SALE`).
  - Khoảng giá: Tùy chỉnh giá tối thiểu và tối đa.
  - Diện tích: Chọn khoảng diện tích sử dụng ($m^2$).
  - Số phòng: Lọc theo số phòng ngủ (BR) và phòng vệ sinh (WC).
  - Tiện ích xung quanh: Lọc theo 9 tiện ích phổ biến (Hồ bơi, Gym, Công viên, Siêu thị, Trường học, Bệnh viện, v.v.).
- **Tương tác thẻ tin (ListingCard):** Xem ảnh đại diện, giá tiền định dạng tiếng Việt (triệu/tháng, tỷ), diện tích, địa chỉ, bấm nút tim để quan tâm/bỏ quan tâm kèm hiệu ứng phản hồi tức thì.

---

### 4.2. Xác thực tài khoản (`/(auth)/login`)
- Chuyển đổi linh hoạt giữa hai tab **Đăng nhập** và **Đăng ký**.
- **Đăng ký:** Xác thực số điện thoại chuẩn Việt Nam (10 số, bắt đầu bằng 0), mật khẩu tối thiểu 8 ký tự, họ và tên.
- **Đăng nhập:** Đăng nhập an toàn bằng Số điện thoại & Mật khẩu.
- **Đăng nhập mạng xã hội (OAuth 2.0):**
  - Tích hợp đăng nhập một chạm với **Google** và **Facebook**.
  - Nhận JWT Token từ callback URL và tự động lưu vào `localStorage`, đồng bộ ngay với Socket.IO.
- **Tự động chuyển hướng:** Nếu người dùng đã đăng nhập từ trước, hệ thống tự động kiểm tra token qua `/auth/me` và chuyển vào trang chủ.

---

### 4.3. Đăng tin phòng trọ / Bất động sản (`/create-listing`)
- **Form đăng tin chuyên nghiệp:**
  - Nhập tiêu đề rõ ràng, mô tả chi tiết phòng trọ.
  - Chọn phân loại bất động sản và hình thức giao dịch.
  - **Bộ chọn địa giới phân cấp (Cascading Dropdowns):** Chọn Tỉnh/Thành $\rightarrow$ Tự động tải Quận/Huyện $\rightarrow$ Tự động tải Phường/Xã trực thuộc.
  - **Nhập tiền tệ thông minh (CurrencyInput):** Tự động format dấu chấm phân tách hàng nghìn (ví dụ: `3.500.000 đ`) khi nhập giá thuê, giá bán và tiền cọc.
  - Chọn thông số kỹ thuật: Diện tích ($m^2$), số lượng WC, số phòng ngủ, trạng thái có thể thương lượng (`isDealable`).
  - Chọn danh sách tiện ích kèm icon trực quan.
- **Upload hình ảnh đa phương tiện:**
  - Hỗ trợ tải lên cùng lúc tối đa **20 hình ảnh** phòng thực tế.
  - Xem trước (preview) hình ảnh dạng lưới, có thể xóa ảnh trước khi đăng.
- **Kết nối AI Moderation:** Tin đăng sau khi gửi sẽ được hệ thống đẩy vào hàng đợi kiểm duyệt AI nền tự động.

---

### 4.4. Chi tiết bài đăng (`/listings/[id]`)
- **Bộ sưu tập hình ảnh (Image Gallery):** Xem ảnh toàn màn hình với bố cục trực quan.
- **Thông số minh bạch:** Giá thuê/tháng, tiền đặt cọc, diện tích sử dụng, ngày bắt đầu vào ở, địa chỉ đầy đủ đến từng phường/xã.
- **Hộp thông tin chủ bài đăng (Host Card):** Xem avatar, họ tên, số điện thoại, tiểu sử và nút dẫn sang hồ sơ công khai của người cho thuê.
- **Hành động liên hệ nhanh:**
  - Nút **"Nhắn tin cho chủ nhà"**: Tự động mở cửa sổ chat 1-1 và đính kèm ngay thẻ bài đăng này vào cuộc trò chuyện.
  - Nút **"Thả tim / Quan tâm"**: Cập nhật lượt quan tâm thời gian thực.
  - Xem trạng thái bài đăng (Đã duyệt, Đang chờ duyệt, Đã cho thuê).

---

### 4.5. Quản lý tin đăng của tôi (`/my-listings`)
- Theo dõi toàn bộ danh sách bất động sản do chính mình đăng tải.
- **Theo dõi trạng thái kiểm duyệt AI thời gian thực:**
  - `PUBLISHED` (Đã xuất bản): Tin đăng hợp lệ, đang hiển thị trên feed.
  - `PENDING_REVIEW` (Đang kiểm duyệt): Tin đang được worker Gemini AI phân tích hình ảnh và nội dung.
  - `REJECTED` (Bị từ chối): Hiển thị rõ ràng các lý do bị từ chối từ AI (ví dụ: hình ảnh không đúng thực tế, mô tả vi phạm chính sách) kèm nút **"Thử kiểm duyệt lại"** (`retryModeration`).
  - `RENTED` (Đã cho thuê).
- **Xem ai đang quan tâm (ListingInterestsModal):** Xem chi tiết danh sách những người dùng đã bấm quan tâm vào từng tin đăng của mình kèm nút mở chat nhanh với họ.
- **Quản lý:** Xóa tin đăng, tải thêm ảnh mới hoặc xóa bớt ảnh cũ.

---

### 4.6. Tin đã lưu & Yêu thích (`/favorites`)
- Tổng hợp toàn bộ các tin phòng trọ mà người dùng đã bấm quan tâm.
- Dễ dàng so sánh giá cả, tiện ích và bấm bỏ lưu chỉ với 1 cú click.

---

### 4.7. Trò chuyện thời gian thực (`/messages`)
Trang tin nhắn được xây dựng toàn diện với hơn 2.600 dòng code xử lý trạng thái cao cấp:
- **Hai loại hình trò chuyện:**
  - **Trò chuyện trực tiếp (Direct Message):** Chat 1-1 giữa người tìm phòng và chủ nhà.
  - **Trò chuyện Hợp đồng (Contract Group Chat):** Nhóm trao đổi giữa chủ nhà và tất cả các thành viên cùng thuê phòng trong hợp đồng.
- **Đính kèm bài đăng (Listing Attachment):** Tin nhắn có thể đính kèm thẻ phòng trọ thu nhỏ (ảnh, giá, địa chỉ) giúp người thuê và chủ nhà dễ dàng thảo luận về căn phòng cụ thể.
- **Gửi ảnh & Tệp đính kèm:** Tải trực tiếp ảnh phòng, hóa đơn, giấy tờ qua bộ lưu trữ S3/MinIO.
- **Trải nghiệm thời gian thực (Socket.IO):**
  - Nhận tin nhắn mới tức thời không cần tải lại trang.
  - Hiệu ứng người đối diện đang soạn tin nhắn (**Typing Indicator**).
  - Trạng thái đã xem tin nhắn (**Read Receipts**).
  - Đếm số cuộc trò chuyện có tin nhắn chưa đọc (**Unread Badge**).
- **Tiện ích hội thoại (ChatSettingsModal):** Đổi tên nhóm chat hợp đồng, xem danh sách thành viên trong phòng, lưu trữ (Archive) hoặc mở lại cuộc trò chuyện.

---

### 4.8. Diễn đàn tìm trọ & bạn ở ghép (`/forum`)
- **Cộng đồng mở:** Không gian cho các bạn sinh viên, người đi làm đăng bài tìm phòng trọ hoặc tìm bạn cùng ở ghép (Roommate) để san sẻ chi phí.
- **Đăng bài nhu cầu:** Chọn loại hình mong muốn (`APARTMENT`, `ROOM`, `HOUSE`), hình thức thuê, vị trí quận/huyện cần tìm và viết nội dung chi tiết.
- **Lọc bài viết:** Lọc bài đăng theo Tỉnh/Thành, Quận/Huyện và nhu cầu thuê/bán.
- **Kết nối tức thì:** Xem người đăng và bấm chat trực tiếp để kết nối ở ghép.

---

### 4.9. Hồ sơ cá nhân (`/profile`)
- **Thông tin tài khoản:** Xem và chỉnh sửa tiểu sử cá nhân (`bio`), thành phố đang sinh sống.
- **Cập nhật số điện thoại:** Cho phép các tài khoản đăng nhập qua mạng xã hội (Google, Facebook) liên kết số điện thoại để đủ điều kiện tạo bài đăng và nhận hợp đồng thuê.
- **Tải lên Avatar:** Tải ảnh đại diện cá nhân, tự động xử lý và tối ưu kích thước qua S3/MinIO.
- **Quản lý hợp đồng thuê:** Xem danh sách các hợp đồng mà người dùng đang tham gia (vai trò Chủ nhà hoặc Khách thuê), xem trạng thái hợp đồng (`ACTIVE`, `PENDING`), chấp thuận hoặc từ chối lời mời hợp đồng, chủ động rời khỏi hợp đồng.

---

### 4.10. Trung tâm thông báo (`NotificationModal` & Header Bell)
- Hộp thoại thông báo trượt mượt mà khi bấm vào biểu tượng Thông báo trên Sidebar/Header.
- **Nhận thông báo tự động khi:**
  - Bài đăng được AI duyệt thành công hoặc bị từ chối (`LISTING_APPROVED`, `LISTING_REJECTED`).
  - Có người dùng khác bấm quan tâm vào bài đăng của bạn (`LISTING_INTEREST`).
  - Nhận được lời mời tham gia hợp đồng thuê nhà từ chủ nhà (`CONTRACT_INVITATION`).
- **Thao tác nhanh:** Đánh dấu đã đọc một thông báo, đánh dấu tất cả đã đọc, xóa từng thông báo.

---

## 🔌 5. Tích hợp Backend & Sự kiện Realtime (Socket.IO)

### 5.1. Cơ chế Socket.IO (`src/lib/socket.ts`)
Ứng dụng sử dụng mô hình kết nối **Singleton**:
- Tự động lấy JWT token từ `localStorage.getItem('accessToken')` để xác thực trong `handshake.auth.token`.
- Hỗ trợ cơ chế tự động kết nối lại (`reconnection: true`) với khoảng nghỉ 2 giây.
- Đồng bộ hóa ngay lập tức khi đăng nhập hoặc đăng xuất (`updateSocketAuth`).

### 5.2. Các sự kiện Socket.IO được Frontend xử lý:

| Tên sự kiện | Hướng | Mô tả xử lý trên giao diện |
| :--- | :---: | :--- |
| `notification:new` | Server $\rightarrow$ Client | Tăng số đếm badge thông báo chưa đọc, hiển thị thông báo mới |
| `notification:unread_count`| Server $\rightarrow$ Client | Đồng bộ chính xác số lượng thông báo chưa đọc trên sidebar |
| `messages:unread_count` | Server $\rightarrow$ Client | Cập nhật số lượng cuộc hội thoại có tin nhắn chưa đọc |
| `message:new` | Server $\rightarrow$ Client | Đẩy tin nhắn mới vào danh sách chat hiện tại hoặc cập nhật tin nhắn cuối cùng |
| `conversation:updated` | Server $\rightarrow$ Client | Cập nhật preview tin nhắn cuối cùng trong danh sách hội thoại |
| `conversation:read` | Server $\rightarrow$ Client | Đánh dấu người khác đã đọc tin nhắn trong khung chat |
| `typing:start` / `stop` | Server $\rightarrow$ Client | Hiển thị/ẩn hoạt ảnh chấm ba chấm (đang soạn tin...) |
| `listing:moderated` | Server $\rightarrow$ Client | Cập nhật trạng thái duyệt tin AI trên trang `my-listings` mà không cần reload |
| `listing:interest_updated` | Server $\rightarrow$ Client | Cập nhật số lượt quan tâm trên card bài đăng |
| `join:conversation` | Client $\rightarrow$ Server | Gửi khi người dùng mở một cuộc hội thoại cụ thể |
| `leave:conversation` | Client $\rightarrow$ Server | Gửi khi người dùng rời khỏi cuộc hội thoại |
| `typing:start` / `stop` | Client $\rightarrow$ Server | Gửi khi người dùng bắt đầu/dừng nhập tin nhắn |

---

## 💻 6. Yêu cầu hệ thống & Cài đặt (Prerequisites & Installation)

### Yêu cầu tiên quyết:
- **Node.js**: Phiên bản 18.x hoặc 20.x trở lên
- **Trình quản lý gói**: `pnpm` (khuyến nghị) hoặc `npm`
- **Backend**: Đang chạy song song (mặc định tại `http://localhost:3000`)

### Các bước cài đặt:

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd D:\Homers\rent-finder_website\stitch_real_estate_rental_app\stitch_real_estate_rental_app
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   pnpm install
   # hoặc dùng npm:
   npm install
   ```

---

## ⚙️ 7. Cấu hình biến môi trường (.env.local)

Tạo file `.env.local` tại thư mục gốc của frontend:

```env
# URL kết nối tới Backend API & Socket.IO Server
NEXT_PUBLIC_API_URL=http://localhost:3000

# (Tùy chọn) API Key tích hợp tiện ích bổ sung nếu có
NEXT_PUBLIC_STITCH_API_KEY=your_optional_api_key_here
```

> [!NOTE]
> Khi deploy lên môi trường Production, thay đổi `NEXT_PUBLIC_API_URL` thành domain backend thực tế (ví dụ: `https://api.yourdomain.com`).

---

## 🚀 8. Hướng dẫn khởi chạy (Run & Scripts)

| Lệnh | Cổng mặc định | Mô tả |
| :--- | :---: | :--- |
| `pnpm dev` | `3001` | Chạy ứng dụng ở chế độ phát triển (Hot-reload) tại `http://localhost:3001` |
| `pnpm build` | - | Biên dịch và tối ưu hóa toàn bộ mã nguồn phục vụ môi trường Production |
| `pnpm start` | `3000` hoặc cổng tùy chỉnh | Khởi chạy máy chủ Production sau khi đã build |
| `pnpm lint` | - | Kiểm tra cú pháp và định dạng mã nguồn theo ESLint |

---

## 🤝 Kết nối với Backend

Ứng dụng Frontend này hoạt động hoàn hảo và tương thích tuyệt đối với mã nguồn tại:
👉 **[Rent Finder Backend](file:///D:/Homers/rent-finder_backend/backend/README.md)** (NestJS + Prisma + BullMQ + Google Gemini AI + Socket.IO).
