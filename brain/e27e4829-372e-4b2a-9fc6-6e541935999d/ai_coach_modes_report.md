# Báo cáo Chi tiết: AI Coach Modes (Prompt & API)

Tài liệu này tổng hợp lại toàn bộ kiến trúc, luồng gọi API và cấu trúc Prompt chi tiết của 4 chế độ AI Coach mới trong hệ thống ShotCoach.

## 1. Luồng API (API Flow)
Việc phân tích hình ảnh và tạo hướng dẫn giờ đây được cá nhân hóa hoàn toàn dựa trên `coachMode`.

### **Client-Side Trigger**
Khi người dùng bấm chụp ảnh hoặc chọn ảnh từ thư viện ở `CameraScreen`, tuỳ vào chế độ hiện tại, Client sẽ gọi hook `useAnalyzePhoto`:
```typescript
// Trong CameraScreen.tsx (real-time overlay flow)
const { analyze } = useAnalyzePhoto();
await analyze(picked.uri, picked.mimeType);
```

### **API Service Layer (`openaiClient.ts`)**
Hook sẽ đẩy lệnh gọi tới API Client. Ở đây, biến `coachMode` được truyền trực tiếp vào hai hàm chính:
1. **Phân tích bức ảnh ban đầu (Vision Analysis):**
   Gọi `analyzeCoachPhotoV2WithOpenAI(imageBase64, mimeType, coachMode)`
2. **Đề xuất hướng dẫn khắc phục (Creative Directions):**
   Gọi `createCoachDirectionsV2WithOpenAI(photoAnalysisJson, imageBase64, mimeType, coachMode)`

Mỗi API request sẽ thay đổi **System Prompt** dựa vào `coachMode` để định hướng GPT-4o tập trung vào một nhóm kỹ năng duy nhất.

---

## 2. Chi tiết Prompt theo từng Mode

Hệ thống sử dụng hàm `getModeFocusInstructions(mode)` để tiêm (inject) các yêu cầu đặc thù vào prompt:

### Mode 1: Composition (Bố cục)
**Mục tiêu:** Giúp bức ảnh có cấu trúc vững chắc, cân bằng.
- **Tiêu điểm AI phân tích:**
  - Quy tắc 1/3 (rule of thirds)
  - Các đường dẫn (leading lines)
  - Sự cân bằng (balance & symmetry)
  - Vị trí đặt chủ thể (subject placement)
  - Các chi tiết gây xao nhãng ở nền (background distractions)
- **Tiêu điểm AI tạo hướng dẫn:**
  - Hướng dẫn cụ thể về việc di chuyển góc nhìn (VD: "Di chuyển chủ thể sang 1/3 khung hình bên trái").
  - Canh gióng đường nét.
  - Loại bỏ các vật thể thừa.

### Mode 2: Frame (Khung hình & Góc máy)
**Mục tiêu:** Tối ưu hóa khoảng cách và góc đặt điện thoại.
- **Tiêu điểm AI phân tích:**
  - Khung hình (framing)
  - Khoảng cách máy ảnh (camera distance)
  - Tỉ lệ cắt cúp (crop ratio)
  - Khoảng không gian trên đầu (headroom)
  - Góc máy ảnh cao/thấp (camera angle & perspective)
- **Tiêu điểm AI tạo hướng dẫn:**
  - Hướng dẫn vật lý về việc di chuyển camera (VD: "Lùi lại 2 bước và hạ điện thoại xuống ngang ngực").
  - Đề xuất tăng/giảm khoảng trống trên đỉnh đầu.

### Mode 3: Pose (Dáng & Ngôn ngữ cơ thể)
**Mục tiêu:** Điều chỉnh tư thế, thần thái để chủ thể trông tự nhiên nhất.
- **Tiêu điểm AI phân tích:**
  - Mức độ dễ đọc của tư thế (pose readability)
  - Ngôn ngữ cơ thể (body language)
  - Vị trí chân tay (hand and limb placement)
  - Dáng điệu & Cột sống (posture)
  - Biểu cảm khuôn mặt & Sự tự nhiên (expression & naturalness)
- **Tiêu điểm AI tạo hướng dẫn:**
  - Hướng dẫn trực tiếp cho mẫu ảnh (VD: "Hãy đứng thẳng người lên, thư giãn vai và cho tay trái vào túi quần").

### Mode 4: Comprehensive (Toàn diện)
**Mục tiêu:** Đánh giá tổng quan mọi khía cạnh (Giữ nguyên logic của phiên bản cũ, được dùng ở màn hình Analyzing).
- **Tiêu điểm AI phân tích:**
  - Bố cục, khung hình, khoảng cách, vị trí chủ thể, ánh sáng, độ tách biệt với nền.
- **Tiêu điểm AI tạo hướng dẫn:**
  - Đưa ra góc nhìn tổng hợp để cải thiện toàn bộ bức hình.

---

## 3. Cấu trúc Prompt Trọng tâm (Actionable Prompting)

Để đảm bảo AI không trả về những lời khuyên sáo rỗng, System Prompt sinh hướng dẫn (`buildCoachDirectionPromptV2`) đã được thiết lập các quy tắc khắt khe như sau:

> **CRITICAL INSTRUCTION FOR AI:** 
> "Your 'summary' field must be highly specific, actionable advice spoken directly to the user (e.g. 'Take a step back, hold the camera lower, and stand up straight with your hands out of your pockets.'). DO NOT use generic phrases like 'adjust angle' or 'improve composition'. Be extremely precise, step-by-step, and physical."

Với thiết lập này, khi ứng dụng hiển thị popup Real-time Guidance trên màn hình Camera, người dùng sẽ đọc được một câu khẩu lệnh thực tế có thể thực hiện ngay lập tức, hoàn toàn phù hợp với trải nghiệm chụp ảnh thời gian thực.
