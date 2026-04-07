# PRD — AI Photo Coach MVP

## 1. Document Info

Product name: AI Photo Coach
Version: MVP v1
Platform: iOS trước, backend cloud
Owner: Product / iOS / Backend / AI
Status: Draft

## 2. Product Summary

AI Photo Coach là app giúp người dùng đánh giá chất lượng ảnh chụp và nhận hướng dẫn cải thiện ngay sau khi chọn hoặc chụp một ảnh.

Sau khi user gửi ảnh, hệ thống dùng OpenAI để phân tích và trả về:

- điểm tổng thể
- điểm theo từng tiêu chí
- nhận xét ngắn gọn
- 2–3 gợi ý cải thiện
- một ảnh visual guide đã được annotate/chỉnh sửa theo gợi ý

Mục tiêu là giúp user hiểu rất nhanh:

- ảnh này ổn chưa,
- nếu chụp lại thì nên sửa gì,
- và sửa như thế nào trên chính tấm ảnh đó.

## 3. Goals

### 3.1 Business goals

- Tạo một trải nghiệm AI đủ “wow” để user thấy giá trị ngay từ ảnh đầu tiên
- Tăng tỷ lệ user hoàn tất vòng phân tích đầu tiên
- Tạo nền tảng cho subscription hoặc credit-based usage sau MVP

### 3.2 Product goals

- Cho phép user nhận kết quả phân tích từ 1 ảnh trong thời gian ngắn
- Kết quả phải trực quan, actionable
- Phần ảnh visual guide phải dễ hiểu hơn text thuần

### 3.3 UX goals

- Time to value thấp
- Không bắt user phải học nhiều
- Luồng phân tích ảnh phải đơn giản: chọn ảnh → chờ → xem kết quả → lưu/share

## 4. Non-goals

MVP không bao gồm:

- realtime live coaching qua camera
- video analysis
- multi-person/group advanced analysis
- full photo editor
- social feed/community
- pose library lớn
- auto-beautify / face enhancement
- chỉnh sửa ảnh photorealistic hoàn chỉnh bằng generative AI

## 5. Target Users

### Primary users

- người dùng phổ thông thích chụp ảnh đi chơi, du lịch, cafe
- người đăng ảnh mạng xã hội
- người muốn biết ảnh nào “đăng được”
- người hay nhờ người khác chụp hộ

### Secondary users

- creator nhỏ
- người hay đi solo trip
- người muốn học cách chụp ảnh đẹp hơn nhưng không chuyên

## 6. Core Value Proposition

“Chọn một ảnh, AI sẽ chấm điểm, góp ý cụ thể, và cho bạn xem ngay một phiên bản hướng dẫn trực quan để biết phải sửa gì.”

## 7. User Problems

### Problem 1

User không biết ảnh hiện tại có đẹp chưa.

### Problem 2

User biết ảnh “chưa ổn” nhưng không biết cần sửa phần nào:

- tư thế
- bố cục
- góc máy
- crop
- background

### Problem 3

Text feedback thuần thường khó hình dung.

### Problem 4

User muốn một lời khuyên nhanh, không muốn học nhiếp ảnh bài bản.

## 8. User Stories

### 8.1 Core user stories

- Là một user, tôi muốn chọn một ảnh từ thư viện để AI phân tích.
- Là một user, tôi muốn chụp ảnh mới rồi gửi đi phân tích ngay.
- Là một user, tôi muốn nhận điểm tổng và nhận xét ngắn gọn về ảnh.
- Là một user, tôi muốn thấy ảnh visual guide để hiểu rõ nên sửa gì.
- Là một user, tôi muốn lưu hoặc share kết quả.

### 8.2 Supporting user stories

- Là một user, tôi muốn xem lại ảnh gốc và ảnh AI guide cạnh nhau hoặc toggle qua lại.
- Là một user, tôi muốn thấy các gợi ý cụ thể thay vì nhận xét chung chung.
- Là một user, tôi muốn biết hệ thống đang xử lý gì khi đang loading.

## 9. Scope

### 9.1 In scope

- Home screen
- Chọn ảnh từ gallery
- Chụp ảnh bằng camera
- Preview trước khi gửi
- Upload ảnh
- Backend gọi OpenAI
- Parse response
- Hiển thị score + feedback + suggestions + visual guide
- Save / share result
- Local history đơn giản

### 9.2 Out of scope

- account system
- cloud sync
- push notification
- editing workflow nhiều bước
- live retake mode
- A/B testing system cho end-user

## 10. Functional Overview

### 10.1 Input

Một ảnh tĩnh do user:

- chụp mới
- hoặc chọn từ thư viện

### 10.2 Processing

- app upload ảnh lên backend
- backend chuẩn hóa ảnh
- backend gọi OpenAI vision analysis
- backend nhận structured output
- backend tạo hoặc lấy visual guide output
- app hiển thị kết quả

### 10.3 Output

- overall score
- sub-scores
- summary
- strengths
- issues
- suggestions
- visual guide image

## 11. Detailed User Flow

### Flow A — Choose from Gallery

1. User mở app
2. Tap “Choose Photo”
3. System photo picker mở ra
4. User chọn 1 ảnh
5. App hiển thị preview
6. User tap “Analyze with AI”
7. App upload ảnh
8. App chuyển sang analyzing state
9. Backend xử lý + gọi OpenAI
10. App nhận result
11. App mở result screen
12. User save/share hoặc quay lại

### Flow B — Take New Photo

1. User mở app
2. Tap “Take Photo”
3. Camera mở
4. User chụp ảnh
5. App preview ảnh vừa chụp
6. User tap “Analyze with AI”
7. Flow tiếp tục như trên

### Flow C — Review Result

1. User xem overall score
2. User xem sub-scores
3. User đọc summary
4. User swipe/tap giữa:
   - original
   - AI guide
5. User đọc suggestions
6. User save hoặc share

## 12. Screen Specifications

### 12.1 Home Screen

#### Purpose

Điểm vào chính của app.

#### Components

- Title
- Subtitle ngắn
- Button: Take Photo
- Button: Choose Photo
- Recent history section nhỏ

#### Acceptance criteria

- User có thể đi tới camera hoặc photo picker trong 1 tap
- Nếu chưa có history thì ẩn section history

### 12.2 Preview Screen

#### Purpose

Cho user xác nhận ảnh trước khi gửi AI.

#### Components

- Image preview
- Back button
- Analyze with AI button
- Optional retake/select another button

#### Acceptance criteria

- Ảnh hiển thị đúng tỷ lệ
- User có thể đổi ảnh trước khi gửi
- Nút Analyze chỉ enable khi có ảnh hợp lệ

### 12.3 Loading / Analyzing Screen

#### Purpose

Cho user biết hệ thống đang xử lý.

#### Components

- Thumbnail ảnh
- Loading animation
- Status text thay đổi theo bước:
  - Uploading photo
  - Reviewing composition
  - Generating feedback
  - Preparing AI guide

#### Acceptance criteria

- Không để màn hình trống
- Phải có trạng thái rõ ràng
- Nếu lỗi thì chuyển sang error state

### 12.4 Result Screen

#### Purpose

Hiển thị kết quả phân tích hoàn chỉnh.

#### Components

- Overall score card
- Original / AI Guide toggle
- Main image area
- Sub-score cards
- Summary block
- Strengths list
- Issues list
- Suggestions cards
- Save button
- Share button

#### Acceptance criteria

- Toggle original/guide hoạt động mượt
- Score hiển thị rõ ràng
- Suggestions ngắn gọn, dễ đọc
- Ảnh guide load thành công trước khi cho share

### 12.5 History Screen / Section

#### Purpose

Cho user mở lại các ảnh vừa phân tích.

#### Components

- List/grid các analysis gần đây
- Thumbnail
- Date/time
- Overall score

#### Acceptance criteria

- Chỉ cần local persistence đơn giản
- Tap item mở lại result detail

## 13. Result Content Design

### 13.1 Overall score

Scale: 0.0 → 10.0

Ví dụ:

- 8.4 Good
- 6.9 Needs improvement

### 13.2 Sub-scores

MVP nên gồm 5 mục:

Với ảnh có người

- Composition
- Pose
- Camera Angle
- Background
- Lighting

Với ảnh không có người

- Composition
- Framing
- Scene Balance
- Background
- Lighting

### 13.3 Summary

1 câu ngắn, ví dụ:

“Nice scene, but the pose and subject placement reduce the impact.”

### 13.4 Strengths

Tối đa 3 ý.

### 13.5 Issues

Tối đa 3 ý.

### 13.6 Suggestions

Tối đa 3 suggestion, mỗi suggestion gồm:

- title
- short description

Ví dụ:

- Look Taller — Lower the camera slightly and turn your body a bit.
- Cleaner Frame — Move subject off center and crop tighter.
- More Natural Pose — Relax arms and shift weight onto one leg.

## 14. AI Output Strategy

### 14.1 Recommended MVP architecture

MVP nên ưu tiên:

- OpenAI trả về structured analysis + visual guidance instructions
- sau đó backend hoặc app render ảnh annotated.

Lý do:

- ổn định hơn
- ít sai lệch ảnh gốc
- dễ QA
- rẻ hơn so với sinh ảnh chỉnh sửa hoàn toàn

### 14.2 User-facing wording

Dù implementation là annotated guide, UI vẫn có thể gọi là:

- AI Guide
- Suggested Version
- Improved Shot Guide

### 14.3 Future support

Sau MVP có thể thêm:

- edited preview bằng generative model
- 2–3 visual styles khác nhau

## 15. OpenAI Responsibilities

OpenAI được dùng cho:

- phân tích ảnh
- chấm điểm
- viết feedback
- sinh suggestion
- sinh overlay instructions hoặc visual guidance metadata

OpenAI không nên là nguồn duy nhất để vẽ trực tiếp ảnh output ở MVP, trừ khi làm demo riêng.

## 16. Backend Requirements

### 16.1 Responsibilities

- nhận ảnh từ app
- resize/compress
- gọi OpenAI API
- validate AI response
- fallback nếu response lỗi
- trả JSON chuẩn cho mobile
- optionally render annotated image
- trả URL hoặc base64 ảnh guide

### 16.2 Image preprocessing

- resize long side về mức phù hợp
- giữ chất lượng đủ để AI phân tích
- giới hạn dung lượng upload

### 16.3 Response normalization

Backend cần:

- đảm bảo score hợp lệ
- thiếu field thì dùng fallback
- sanitize text trước khi trả app

## 17. API Contract

### 17.1 Analyze Photo API

#### Endpoint

`POST /api/v1/photo/analyze`

#### Request

`multipart/form-data` hoặc upload trước rồi gửi URL

#### Request fields

- `image_file`
- `client_platform`
- `app_version`
- `analysis_mode = standard`

#### Sample response

```json
{
  "analysis_id": "a1b2c3",
  "status": "completed",
  "overall_score": 7.3,
  "subscores": {
    "composition": 8.0,
    "pose": 6.4,
    "camera_angle": 6.8,
    "background": 7.5,
    "lighting": 7.0
  },
  "summary": "Good scene and balanced light, but the pose feels stiff and the subject is too centered.",
  "strengths": [
    "The background has nice depth",
    "Lighting is fairly balanced",
    "The scene is visually attractive"
  ],
  "issues": [
    "Subject placement is too centered",
    "Body angle looks stiff",
    "Camera height is not flattering"
  ],
  "suggestions": [
    {
      "title": "Look Taller",
      "description": "Lower the camera slightly and turn the body around 20 to 30 degrees."
    },
    {
      "title": "Cleaner Composition",
      "description": "Move the subject toward the right third and crop slightly tighter."
    },
    {
      "title": "Natural Pose",
      "description": "Relax the arms and shift weight onto one leg."
    }
  ],
  "visual_output": {
    "type": "annotated_image",
    "image_url": "https://cdn.example.com/guide/a1b2c3.jpg"
  },
  "overlay_data": {
    "grid": true,
    "crop_rect": {
      "x": 0.12,
      "y": 0.08,
      "w": 0.72,
      "h": 0.84
    },
    "arrows": [
      {
        "from": [0.50, 0.70],
        "to": [0.62, 0.70],
        "label": "Move slightly right"
      }
    ],
    "notes": [
      {
        "x": 0.56,
        "y": 0.31,
        "text": "Turn shoulders a bit"
      },
      {
        "x": 0.42,
        "y": 0.85,
        "text": "Lower camera slightly"
      }
    ]
  }
}
```

### 17.2 Error response

```json
{
  "status": "failed",
  "error_code": "ANALYSIS_TIMEOUT",
  "message": "AI analysis took too long."
}
```

## 18. Mobile Data Models

### 18.1 AnalysisResult

- analysisId: String
- overallScore: Double
- subscores: [String: Double]
- summary: String
- strengths: [String]
- issues: [String]
- suggestions: [Suggestion]
- visualOutput: VisualOutput?
- overlayData: OverlayData?

### 18.2 Suggestion

- title: String
- description: String

### 18.3 VisualOutput

- type: String
- imageURL: String?

### 18.4 OverlayData

- grid: Bool
- cropRect: CGRect normalized
- arrows: [Arrow]
- notes: [OverlayNote]

## 19. Prompt / AI Instruction Requirements

### 19.1 Prompt goals

Buộc AI:

- phân tích như một photography coach
- dùng ngôn ngữ ngắn, dễ hiểu
- output đúng schema

### 19.2 Constraints

AI không được:

- suy đoán tuổi, giới tính, chủng tộc, tôn giáo, tình trạng sức khỏe
- dùng ngôn ngữ body shaming
- đưa lời khuyên xúc phạm hoặc quá chủ quan
- output quá dài

### 19.3 Expected output style

- practical
- short
- direct
- friendly
- actionable

## 20. Scoring Rules

### 20.1 Score format

- decimal từ 0.0 đến 10.0
- tối đa 1 chữ số thập phân

### 20.2 Interpretation

- 0.0–4.9: weak
- 5.0–6.9: acceptable but needs work
- 7.0–8.4: good
- 8.5–10.0: strong

### 20.3 Score consistency rules

Backend nên validate:

- overall score phải tồn tại
- ít nhất 4 sub-scores
- suggestion count từ 1 đến 3
- strengths/issues không vượt quá 3 item mỗi loại

## 21. Visual Guide Rules

### 21.1 Goal

User nhìn vào visual guide là hiểu:

- nên crop lại ở đâu
- nên đứng dịch đi đâu
- nên xoay người ra sao
- nên hạ/nâng camera thế nào

### 21.2 Allowed overlays

- thirds grid
- crop rectangle
- move arrows
- text notes ngắn
- subject placement marker
- body angle hints

### 21.3 Not allowed in MVP

- edit làm thay đổi gương mặt
- chỉnh body shape
- beautify
- thay background
- xóa người/vật thể bằng AI generative

## 22. Save / Share Behavior

### Save

- lưu AI guide image vào Photos hoặc local app storage

### Share

- share ảnh guide
- optionally share ảnh original + guide ở phase sau

### Acceptance criteria

- save/share phải hoạt động cả khi app mở lại analysis từ history
- nếu visual_output chưa có, disable share guide

## 23. Error States

### 23.1 Upload error

Message: Không thể tải ảnh lên.

### 23.2 AI timeout

Message: Phân tích mất lâu hơn dự kiến.

### 23.3 Invalid image

Message: Ảnh này chưa đủ rõ để phân tích.

### 23.4 Missing visual guide

Message: Đã có score và góp ý, nhưng chưa tạo được ảnh hướng dẫn.

## 24. Privacy & Safety

### 24.1 User disclosure

Cần thông báo rõ:

- ảnh sẽ được gửi lên server để AI phân tích

### 24.2 Data handling

- ảnh chỉ dùng cho phân tích
- xóa ảnh tạm sau khoảng thời gian xác định
- không dùng ảnh cho mục đích huấn luyện nếu không có consent riêng

### 24.3 Safety

Hệ thống phải tránh:

- body shaming
- harsh judgment
- suy đoán thuộc tính nhạy cảm

## 25. Performance Requirements

Target

- upload + analysis + render result: mục tiêu 5–12 giây
- result screen hiển thị skeleton/loading state nếu ảnh guide chậm hơn text
- thumbnail hiển thị ngay khi đang xử lý

## 26. Analytics Events

Suggested events

- home_opened
- take_photo_tapped
- choose_photo_tapped
- photo_selected
- analyze_tapped
- analysis_started
- analysis_completed
- analysis_failed
- result_viewed
- guide_toggled
- save_tapped
- share_tapped
- history_item_opened

## 27. Success Metrics

### Activation

- % user chọn/chụp ít nhất 1 ảnh
- % user bấm Analyze

### Completion

- % analysis thành công
- % user xem đến result screen

### Engagement

- % user toggle sang AI guide
- % user save/share result
- số analysis trung bình / tuần / user

### Quality

- user feedback helpful rate
- crash-free rate
- AI response valid rate

## 28. Risks

### Risk 1

AI feedback nghe hợp lý nhưng không actionable.

Mitigation: ép schema, text ngắn, overlay trực quan.

### Risk 2

AI output không ổn định giữa các ảnh tương tự.

Mitigation: backend normalize, logging, QA sample set.

### Risk 3

Chi phí OpenAI cao.

Mitigation: resize ảnh, giới hạn free quota, cache result.

### Risk 4

User kỳ vọng “AI sửa ảnh đẹp hoàn hảo”.

Mitigation: định vị rõ là coaching/guidance, không phải magic editor.

## 29. MVP Acceptance Criteria

MVP được xem là đạt nếu:

- User có thể chụp hoặc chọn 1 ảnh.
- App gửi ảnh thành công lên backend.
- Backend gọi OpenAI và nhận được structured result.
- App hiển thị:
  - overall score
  - ít nhất 4 sub-scores
  - summary
  - strengths/issues
  - từ 1 đến 3 suggestions
  - 1 AI guide image hoặc overlay result
- User có thể save hoặc share AI guide image.
- App xử lý được lỗi upload/timeout/invalid image.
- Flow hoàn thành trong thời gian chấp nhận được.

## 30. Suggested MVP Milestones

### Milestone 1 — Foundation

- camera / picker
- preview
- upload
- loading states

### Milestone 2 — AI Integration

- backend API
- OpenAI call
- JSON parsing
- basic result display

### Milestone 3 — Visual Guide

- overlay schema
- guide rendering
- result toggle

### Milestone 4 — Polish

- history
- save/share
- analytics
- error handling
- copy polish

## 31. Future Roadmap

### v1.5

- 2–3 guide styles
- scene-specific hints
- compare mode between two photos

### v2

- live retake guide
- personalized coaching memory
- couple/group mode
- generative edited preview
