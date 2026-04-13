# Handover: Chuc nang Quen Mat Khau + Doi Mat Khau (User, Organizer va Admin)

## 1) Pham vi va muc tieu
Tai lieu nay mo ta day du cac thay doi lien quan den:
- Quen mat khau tai form dang nhap.
- Dieu huong bat buoc vao trang profile sau khi dang nhap bang mat khau vua reset.
- Doi mat khau ngay tren profile/setting cua user, organizer va admin.

Pham vi trien khai: FE su dung API BE co san, khong thay doi logic BE.

---

## 2) Vi tri code lien quan

### FE
- `FE/src/components/auth/LoginModal.tsx`
- `FE/src/services/authService.ts`
- `FE/src/layouts/ClientLayout.tsx`
- `FE/src/layouts/AdminLayout.tsx`
- `FE/src/pages/client/ProfilePage/index.tsx`
- `FE/src/pages/organizer/ProfilePage/index.tsx`
- `FE/src/pages/admin/SettingPage/index.tsx`
- `FE/src/App.tsx`

### BE (vi tri API da su dung)
- `BE/routes/userRoutes.js`
  - `POST /api/user/forgot-password`
  - `POST /api/user/login`
  - `PUT /api/user/profile`
- `BE/controllers/userController.js`
  - `getNewPassword`
  - `loginUser`
  - `updateUser`

---

## 3) Tong quan luong nghiep vu

1. Nguoi dung/organizer/admin bam Quen mat khau trong modal dang nhap.
2. FE goi API forgot-password de BE cap mat khau ngau nhien va gui email.
3. FE luu email vua reset vao sessionStorage.
4. Nguoi dung dang nhap lai bang mat khau moi.
5. Neu email dang nhap trung email vua reset:
   - role user -> dieu huong `/profile`
   - role organizer -> dieu huong `/organizer/profile`
  - role admin -> dieu huong `/admin/settings`
6. Tai trang profile/setting, nguoi dung co the bam nut Doi mat khau de mo form va cap nhat mat khau moi.

---

## 4) Danh sach API da dung, vi tri API va cong dung

## 4.1 POST /api/user/forgot-password

### Vi tri API trong BE
- Route: `BE/routes/userRoutes.js`
  - `router.post('/forgot-password', getNewPassword)`
- Controller: `BE/controllers/userController.js`
  - Ham: `getNewPassword`

### Cong dung
- Nhan `email` tu FE.
- Kiem tra email co ton tai khong.
- Tao mat khau ngau nhien 8 ky tu.
- Hash mat khau moi bang bcrypt roi luu vao DB.
- Gui mat khau moi qua email.

### Request body
```json
{
  "email": "user@example.com"
}
```

### Response thanh cong (vi du)
```json
{
  "message": "Mật khẩu mới đã được gửi đến email của bạn"
}
```

### Response loi thuong gap
- `404`: Email khong ton tai.
- `500`: Loi he thong hoac gui email that bai.

### Noi FE goi API
- Service: `FE/src/services/authService.ts`
  - `forgotPasswordAPI(data)`
- UI callsite: `FE/src/components/auth/LoginModal.tsx`
  - Ham `handleForgotPassword`

---

## 4.2 POST /api/user/login

### Vi tri API trong BE
- Route: `BE/routes/userRoutes.js`
  - `router.post('/login', loginUser)`
- Controller: `BE/controllers/userController.js`
  - Ham: `loginUser`

### Cong dung
- Xac thuc email + password.
- Tra JWT token cho FE.

### Request body
```json
{
  "email": "user@example.com",
  "password": "newRandomPwd"
}
```

### Response thanh cong (vi du)
```json
{
  "token": "<jwt_token>"
}
```

### Noi FE goi API
- Service: `FE/src/services/authService.ts`
  - `loginAPI(data)`
- UI callsite: `FE/src/components/auth/LoginModal.tsx`
  - Ham `onFinish`

---

## 4.3 PUT /api/user/profile

### Vi tri API trong BE
- Route: `BE/routes/userRoutes.js`
  - `router.put('/profile', verifyToken, updateUser)`
- Controller: `BE/controllers/userController.js`
  - Ham: `updateUser`

### Cong dung
- Cap nhat thong tin profile cua user dang dang nhap.
- Neu payload co truong `password`, BE se hash mat khau truoc khi luu.

### Request body cho doi mat khau
```json
{
  "password": "newStrongPassword"
}
```

### Noi FE goi API
- User profile:
  - File: `FE/src/pages/client/ProfilePage/index.tsx`
  - Ham: `handleChangePassword`
  - Call: `axiosClient.put('/api/user/profile', { password })`
- Organizer profile:
  - File: `FE/src/pages/organizer/ProfilePage/index.tsx`
  - Ham: `handleChangePassword`
  - Call: `axiosClient.put('/api/user/profile', { password })`
- Admin setting:
  - File: `FE/src/pages/admin/SettingPage/index.tsx`
  - Ham: `handleChangePassword`
  - Call: `axiosClient.put('/api/user/profile', { password })`

---

## 4.4 GET /api/organizer (bo tro dang nhap organizer)

### Vi tri API trong FE service
- `FE/src/services/organizerService.ts`
  - `getAllOrganizersAPI()`

### Cong dung
- Sau khi dang nhap role organizer, FE goi API nay de map `userId` -> `organizerId` va luu localStorage.
- Khong phai API cot loi cua forgot-password, nhung van nam trong luong `onFinish` dang nhap.

### Noi FE goi API
- `FE/src/components/auth/LoginModal.tsx`
  - Ham `onFinish` khi role organizer.

---

## 5) Chi tiet ky thuat FE da thay doi

## 5.1 LoginModal: quen mat khau va force vao profile/setting
File: `FE/src/components/auth/LoginModal.tsx`

- Them popup Quen mat khau voi email input.
- Them `okButtonProps` de nut gui mat khau moi hien ro o trang thai thuong.
- Sau khi goi forgot-password thanh cong:
  - Luu email da normalize vao `sessionStorage` voi key:
    - `forgot_password_email_forced_profile`
- Sau login thanh cong:
  - Neu role la user, organizer hoac admin va email trung key tren:
    - xoa key
    - dieu huong:
      - user -> `/profile`
      - organizer -> `/organizer/profile`
      - admin -> `/admin/settings`
    - hien thong bao nhac doi mat khau.

## 5.2 AdminLayout + App: thay Messages bang Setting
Files:
- `FE/src/layouts/AdminLayout.tsx`
- `FE/src/App.tsx`

- Menu role admin da duoc doi tu `Messages` sang `Setting`.
- Route chinh cho admin setting la `/admin/settings`.
- Route cu `/admin/messages` duoc giu lai duoi dang redirect sang `/admin/settings` de tranh gay vo link cu.

## 5.3 ClientLayout: tranh redirect de
File: `FE/src/layouts/ClientLayout.tsx`

- `handleLoginSuccess` nhan them option `{ skipPendingRedirect?: boolean }`.
- Neu `skipPendingRedirect=true`, se khong chay pending redirect.
- Muc dich: tranh viec bi day sang trang khac khi vua can vao profile de doi mat khau.

## 5.4 User profile: them doi mat khau
File: `FE/src/pages/client/ProfilePage/index.tsx`

- Them section Bao mat tai khoan.
- Mac dinh an form, bam nut Doi mat khau moi hien form.
- Form gom:
  - Mat khau moi
  - Xac nhan mat khau moi
- Validate:
  - bat buoc
  - toi thieu 6 ky tu
  - xac nhan trung khop
- Submit call `PUT /api/user/profile`.
- UI da duoc polish (khung nen nhat, nut ro rang, bo goc, spacing thong nhat).

## 5.5 Organizer profile: them doi mat khau
File: `FE/src/pages/organizer/ProfilePage/index.tsx`

- Them section Bao mat tai khoan.
- Mac dinh an form, bam nut Doi mat khau moi hien form.
- Validate va API call giong user profile.
- Doi thanh cong se reset form va dong form lai.
- UI da duoc polish dong bo voi user profile.

## 5.6 Admin setting: them doi mat khau
File: `FE/src/pages/admin/SettingPage/index.tsx`

- Thay placeholder settings cu bang trang quan ly tai khoan admin.
- Goi `GET /api/user/profile` de hien thong tin admin hien tai.
- Hien cac thong tin co ban:
  - Ho va ten
  - Email
  - So dien thoai
  - Gioi tinh
  - Vai tro
  - Ngay tao va cap nhat
- Them section Bao mat tai khoan admin.
- Mac dinh an form, bam nut Doi mat khau moi hien form.
- Validate va API call giong user/organizer.

---

## 6) Cases can test

1. Quen mat khau voi email hop le (user):
- Nhan email mat khau moi.
- Dang nhap bang mat khau moi -> vao `/profile`.

2. Quen mat khau voi email hop le (organizer):
- Nhan email mat khau moi.
- Dang nhap bang mat khau moi -> vao `/organizer/profile`.

3. Quen mat khau voi email hop le (admin):
- Nhan email mat khau moi.
- Dang nhap bang mat khau moi -> vao `/admin/settings`.

4. Quen mat khau voi email khong ton tai:
- Hien loi dung tu API.

5. Login binh thuong (khong qua forgot-password):
- Luong dieu huong giu nguyen nhu truoc.

6. Co pending redirect truoc do:
- Neu vua login bang mat khau reset, uu tien vao profile va khong bi pending redirect de.

7. Doi mat khau tren profile user:
- Bam nut Doi mat khau -> form hien ra.
- Nhap sai confirm -> bao loi.
- Nhap dung -> call API, success message, dong form.

8. Doi mat khau tren profile organizer:
- Tuong tu user profile.

9. Doi mat khau tren setting admin:
- Bam nut Doi mat khau -> form hien ra.
- Nhap sai confirm -> bao loi.
- Nhap dung -> call API, success message, dong form.

---

## 7) Luu y quan trong

- Toan bo luong tren su dung API BE co san, khong can mo rong BE de chay feature.
- Co che force vao profile chi kich hoat 1 lan cho email vua reset (vi key sessionStorage duoc xoa sau khi xu ly).
- Doi mat khau user/organizer/admin deu di qua `PUT /api/user/profile`, phu hop voi logic hash password tai `updateUser` trong BE.
