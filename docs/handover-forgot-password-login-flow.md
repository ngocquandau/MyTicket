# Handover: Chuc nang Quen Mat Khau + Doi Mat Khau (User, Organizer va Admin)

## 1) Pham vi va muc tieu
Tai lieu nay mo ta day du luong chay thuc te cua chuc nang:
- Quen mat khau tai form dang nhap.
- Dang nhap lai bang mat khau moi duoc cap qua email.
- Dieu huong bat buoc vao profile/setting sau khi reset mat khau.
- Doi mat khau chu dong tren profile/setting cua user, organizer va admin.

Pham vi trien khai:
- FE su dung API BE co san.
- Khong mo rong them endpoint moi cho tinh nang nay.
- Luong doi mat khau sau login dung chung `PUT /api/user/profile`.

---

## 2) Vi tri code lien quan

### FE
- `FE/src/components/auth/LoginModal.tsx`
- `FE/src/services/authService.ts`
- `FE/src/services/axiosClient.ts`
- `FE/src/utils/auth.ts`
- `FE/src/layouts/ClientLayout.tsx`
- `FE/src/pages/client/ProfilePage/index.tsx`
- `FE/src/pages/organizer/ProfilePage/index.tsx`
- `FE/src/pages/admin/SettingPage/index.tsx`
- `FE/src/App.tsx`

### BE
- `BE/app.js`
- `BE/routes/userRoutes.js`
- `BE/controllers/userController.js`
- `BE/middleware/auth.js`
- `BE/models/User.js`
- `BE/services/emailService.js`

---

## 3) Tong quan nghiep vu

1. Nguoi dung bam `Quen mat khau?` trong `LoginModal`.
2. FE mo popup nhap email va goi `POST /api/user/forgot-password`.
3. BE tao mot mat khau ngau nhien moi, hash roi luu vao DB, sau do gui mat khau moi qua email.
4. FE luu email vua reset vao `sessionStorage` voi key `forgot_password_email_forced_profile`.
5. Nguoi dung dang nhap lai bang mat khau moi nhan duoc trong email.
6. Sau login thanh cong, FE so sanh email dang nhap voi email vua reset:
   - user -> dieu huong `/profile`
   - organizer -> dieu huong `/organizer/profile`
   - admin -> dieu huong `/admin/settings`
7. Tai trang profile/setting, nguoi dung bam `Doi mat khau` va goi `PUT /api/user/profile` de dat lai mat khau moi cua rieng minh.

---

## 4) Sequence diagram

## 4.1 Sequence: quen mat khau -> dang nhap lai -> force vao profile/setting

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant LM as LoginModal.tsx
    participant AS as authService.ts
    participant AX as axiosClient.ts
    participant APP as BE app.js
    participant UR as userRoutes.js
    participant UC as userController.js
    participant US as User model
    participant ES as emailService.js
    participant AU as utils/auth.ts
    participant CL as ClientLayout.tsx
    participant RT as App routes

    U->>LM: Bam "Quen mat khau?"
    LM->>LM: setForgotOpen(true)
    U->>LM: Nhap email va bam gui
    LM->>LM: forgotForm.submit()
    LM->>LM: handleForgotPassword(values)
    LM->>AS: forgotPasswordAPI({ email })
    AS->>AX: POST /api/user/forgot-password
    AX->>APP: Request vao backend
    APP->>UR: Match prefix /api/user
    UR->>UC: getNewPassword(req, res)
    UC->>US: findOne({ email })
    alt Email ton tai
        UC->>UC: Tao random password 8 ky tu
        UC->>UC: bcrypt.hash(password moi)
        UC->>US: save(user.password da hash)
        UC->>ES: sendNewPassword({ cusEmail, cusName, password })
        ES-->>UC: { success: true }
        UC-->>LM: 200 + message thanh cong
        LM->>LM: sessionStorage.setItem(forgot_password_email_forced_profile, normalizedEmail)
        LM->>LM: Dien san email vao form login va dong popup forgot
    else Email khong ton tai
        UC-->>LM: 404 + message loi
        LM->>U: Hien thong bao loi
    end

    U->>LM: Dang nhap bang email + mat khau moi
    LM->>AS: loginAPI({ email, password })
    AS->>AX: POST /api/user/login
    AX->>APP: Request vao backend
    APP->>UR: Match prefix /api/user
    UR->>UC: loginUser(req, res)
    UC->>US: findOne({ email }).select('+password')
    UC->>UC: bcrypt.compare(password)
    UC->>US: user.isActive = true; save()
    UC-->>LM: 200 + JWT token
    LM->>AU: saveToken(token)
    LM->>AU: getUserRole(), getUserFromToken()
    LM->>LM: Lay forgot_password_email_forced_profile tu sessionStorage
    alt Email vua login trung email vua reset
        LM->>LM: sessionStorage.removeItem(key)
        LM->>RT: navigate theo role
        RT-->>U: /profile | /organizer/profile | /admin/settings
        LM->>CL: onLoginSuccess({ skipPendingRedirect: true })
        CL->>CL: setPendingRedirect(null)
    else Login binh thuong
        LM->>RT: navigate mac dinh theo role
        LM->>CL: onLoginSuccess()
    end
```

## 4.2 Sequence: doi mat khau tren profile/setting

```mermaid
sequenceDiagram
    autonumber
    actor U as User/Organizer/Admin
    participant PF as ProfilePage or SettingPage
    participant AX as axiosClient.ts
    participant MW as auth.js
    participant UR as userRoutes.js
    participant UC as userController.js
    participant US as User model

    U->>PF: Bam "Doi mat khau"
    PF->>PF: setShowChangePassword(true)
    U->>PF: Nhap password moi + confirm
    PF->>PF: Validate bat buoc, min 6, confirm khop
    PF->>AX: PUT /api/user/profile { password }
    AX->>AX: Gan Authorization: Bearer token
    AX->>UR: Request /api/user/profile
    UR->>MW: verifyToken
    MW->>MW: jwt.verify(token)
    MW->>US: findById(decoded.id) de kiem tra isActive
    MW-->>UR: req.user = decoded
    UR->>UC: updateUser(req, res)
    UC->>UC: userId = req.user.id vi route /profile
    UC->>UC: bcrypt.hash(req.body.password)
    UC->>US: findByIdAndUpdate(userId, req.body)
    UC-->>PF: Response thanh cong
    PF->>PF: resetFields(); setShowChangePassword(false)
    PF->>U: Hien message doi mat khau thanh cong
```

---

## 5) Luong chay chi tiet theo thu tu thuc thi

## 5.1 Khi nguoi dung bam `Quen mat khau?`

### Diem vao FE
- File: `FE/src/components/auth/LoginModal.tsx`
- Nut `Quen mat khau?` chi co tac dung mo popup forgot bang `setForgotOpen(true)`.
- Popup forgot dung 1 `Form` rieng (`forgotForm`) de submit email.

### Khi nguoi dung bam gui trong popup
- `Modal.onOk` goi `forgotForm.submit()`.
- `forgotForm` duoc gan `onFinish={handleForgotPassword}`.
- Tu day ham `handleForgotPassword(values)` duoc thuc thi.

### Cong dung cua `handleForgotPassword`
- Bat loading cho popup forgot.
- Goi `forgotPasswordAPI(values)`.
- Neu thanh cong:
  - luu email da normalize vao `sessionStorage`
  - set email do lai vao form login chinh
  - reset forgot form
  - dong popup forgot
- Neu that bai:
  - hien message loi tu API neu co

---

## 5.2 FE goi API nao

### Service FE
- File: `FE/src/services/authService.ts`
- `forgotPasswordAPI(data)` goi `POST /api/user/forgot-password`
- `loginAPI(data)` goi `POST /api/user/login`

### Axios client
- File: `FE/src/services/axiosClient.ts`
- Cau hinh `baseURL` cho moi request.
- Voi API can dang nhap nhu `PUT /api/user/profile`, interceptor se tu gan `Authorization: Bearer <token>`.

---

## 5.3 Backend xu ly `POST /api/user/forgot-password`

### Di qua app va route
- `BE/app.js` mount `userRoutes` tai prefix `/api/user`.
- `BE/routes/userRoutes.js` map endpoint `/forgot-password` vao controller `getNewPassword`.

### Cong dung cua `getNewPassword`
File: `BE/controllers/userController.js`

Thu tu xu ly:
1. Lay `email` tu `req.body`.
2. Tim user bang `User.findOne({ email })`.
3. Neu khong tim thay, tra `404` voi message `Email khong ton tai`.
4. Neu tim thay:
   - tao mat khau moi ngau nhien 8 ky tu
   - hash bang `bcrypt.hash(...)`
   - gan lai `user.password`
   - `await user.save()`
5. Goi `sendNewPassword(...)` trong `BE/services/emailService.js` de gui email chua mat khau moi.
6. Tra `200` cho FE neu gui email thanh cong.

### Cong dung cua `sendNewPassword`
- Dung `nodemailer`.
- Gui email den dung dia chi `cusEmail`.
- Noi dung email co mat khau moi va huong dan dang nhap lai de doi mat khau.

---

## 5.4 FE lam gi sau khi forgot-password thanh cong

File: `FE/src/components/auth/LoginModal.tsx`

Sau khi API forgot-password thanh cong, FE lam 4 viec lien tiep:
1. Luu email da reset vao `sessionStorage` voi key `forgot_password_email_forced_profile`.
2. Hien thong bao thanh cong cho nguoi dung.
3. Tu dong dien email vao form login chinh.
4. Dong popup forgot de nguoi dung dang nhap lai.

Muc dich cua `sessionStorage` la danh dau rang lan login tiep theo voi email nay can duoc uu tien dua vao profile/setting de doi mat khau ngay.

---

## 5.5 Khi nguoi dung dang nhap lai bang mat khau moi

### FE bat dau tai dau
- Van o `FE/src/components/auth/LoginModal.tsx`
- Form login chinh submit vao ham `onFinish(values)`.

### `onFinish(values)` lam gi
1. Goi `loginAPI(values)`.
2. Nhan JWT token tu backend.
3. Goi `saveToken(token)` trong `FE/src/utils/auth.ts` de luu token.
4. Dung `getUserRole()` de lay role tu payload token.
5. Neu la organizer, FE con goi them `getAllOrganizersAPI()` de map `userId` -> `organizerId` va luu localStorage.
6. Doc email da luu trong `sessionStorage`.
7. So sanh email vua login voi email vua reset.

### Neu dung la login sau reset
- Xoa key trong `sessionStorage` de luong force chi chay 1 lan.
- Dieu huong theo role:
  - user -> `/profile`
  - organizer -> `/organizer/profile`
  - admin -> `/admin/settings`
- Hien thong bao nhac doi mat khau.
- Goi `onLoginSuccess({ skipPendingRedirect: true })`.

### Tai sao can `skipPendingRedirect`
- File: `FE/src/layouts/ClientLayout.tsx`
- Layout nay co co che `pendingRedirect` de dua user toi trang ho tung muon vao sau khi login.
- Trong case reset password, uu tien cao nhat la vao profile/setting de doi mat khau.
- Vi vay `skipPendingRedirect=true` se xoa bo redirect tam truoc do, tranh viec vua dang nhap xong bi day sang trang khac.

---

## 5.6 Backend xu ly `POST /api/user/login`

### Route
- `BE/routes/userRoutes.js` map `/login` -> `loginUser`.

### Controller `loginUser`
File: `BE/controllers/userController.js`

Thu tu xu ly:
1. Lay `email`, `password` tu `req.body`.
2. Goi `User.findOne({ email }).select('+password')`.
3. Phai dung `.select('+password')` vi trong `BE/models/User.js`, field `password` duoc khai bao `select: false`.
4. So sanh mat khau bang `bcrypt.compare(...)`.
5. Neu dung:
   - set `user.isActive = true`
   - `await user.save()`
   - tao JWT chua `id`, `email`, `role`
   - tra token cho FE

---

## 5.7 Route nao duoc mo sau login

File: `FE/src/App.tsx`

Route duoc force mo sau login bang mat khau reset:
- user -> `/profile`
- organizer -> `/organizer/profile`
- admin -> `/admin/settings`

Tat ca cac route nay deu duoc boc boi `ProtectedRoute`, nghia la:
- phai co token hop le
- phai dung role moi vao duoc dung trang

---

## 5.8 Khi nguoi dung bam `Doi mat khau`

### Vi tri form doi mat khau
- User: `FE/src/pages/client/ProfilePage/index.tsx`
- Organizer: `FE/src/pages/organizer/ProfilePage/index.tsx`
- Admin: `FE/src/pages/admin/SettingPage/index.tsx`

### Hanh vi UI
- Ban dau form doi mat khau bi an.
- Bam `Doi mat khau` -> `setShowChangePassword(true)`.
- Form validate:
  - bat buoc nhap
  - toi thieu 6 ky tu
  - confirm phai giong password

### Khi submit form doi mat khau
- Ham `handleChangePassword(values)` duoc goi.
- FE goi `axiosClient.put('/api/user/profile', { password: values.password.trim() })`.

---

## 5.9 Backend xu ly `PUT /api/user/profile`

### Route
- `BE/routes/userRoutes.js`
- Endpoint nay di qua `verifyToken` truoc khi vao `updateUser`.

### `verifyToken` lam gi
File: `BE/middleware/auth.js`

Thu tu xu ly:
1. Lay token tu header `Authorization`.
2. `jwt.verify(token, SECRET_KEY)`.
3. Tim user tu DB de kiem tra `isActive`.
4. Neu hop le, gan `req.user = decoded`.
5. `next()` de vao controller.

### `updateUser` lam gi
File: `BE/controllers/userController.js`

Thu tu xu ly:
1. Neu route la `/profile`, controller lay `userId = req.user.id`.
2. Neu payload co `password`, hash lai bang `bcrypt.hash(...)`.
3. Goi `User.findByIdAndUpdate(userId, req.body, { new: true, runValidators: true })`.
4. Tra user da cap nhat ve FE.

### Tai sao user doi mat khau cua chinh ho
- Vi `userId` khong lay tu input FE trong route `/profile`.
- No lay truc tiep tu token da xac thuc.
- Nghia la moi user chi doi duoc mat khau cua tai khoan dang dang nhap.

---

## 6) Danh sach API da dung va cong dung

## 6.1 POST /api/user/forgot-password

### Vi tri API trong BE
- Route: `BE/routes/userRoutes.js`
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

### Response thanh cong
```json
{
  "message": "Mat khau moi da duoc gui den email cua ban"
}
```

### Response loi thuong gap
- `404`: Email khong ton tai.
- `500`: Loi he thong hoac gui email that bai.

---

## 6.2 POST /api/user/login

### Vi tri API trong BE
- Route: `BE/routes/userRoutes.js`
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

### Response thanh cong
```json
{
  "token": "<jwt_token>"
}
```

---

## 6.3 PUT /api/user/profile

### Vi tri API trong BE
- Route: `BE/routes/userRoutes.js`
- Middleware: `BE/middleware/auth.js`
- Controller: `BE/controllers/userController.js`
- Ham: `updateUser`

### Cong dung
- Cap nhat profile cua user dang dang nhap.
- Khi payload co truong `password`, backend se hash truoc khi luu.

### Request body cho doi mat khau
```json
{
  "password": "newStrongPassword"
}
```

### Noi FE goi API
- User profile -> `FE/src/pages/client/ProfilePage/index.tsx`
- Organizer profile -> `FE/src/pages/organizer/ProfilePage/index.tsx`
- Admin setting -> `FE/src/pages/admin/SettingPage/index.tsx`

---

## 6.4 GET /api/organizer

### Cong dung
- Khong phai API cot loi cua forgot-password.
- Chi la buoc phu trong login organizer de map `userId` sang `organizerId`.

### Noi FE goi API
- `FE/src/components/auth/LoginModal.tsx`
- Chi chay khi role sau login la organizer.

---

## 7) Cases can test

1. Quen mat khau voi email hop le cua user:
   - Nhan email chua mat khau moi.
   - Dang nhap bang mat khau moi.
   - He thong vao `/profile`.

2. Quen mat khau voi email hop le cua organizer:
   - Nhan email chua mat khau moi.
   - Dang nhap bang mat khau moi.
   - He thong vao `/organizer/profile`.

3. Quen mat khau voi email hop le cua admin:
   - Nhan email chua mat khau moi.
   - Dang nhap bang mat khau moi.
   - He thong vao `/admin/settings`.

4. Quen mat khau voi email khong ton tai:
   - API tra loi 404.
   - FE hien dung message loi.

5. Login binh thuong, khong qua forgot-password:
   - Dieu huong giu nguyen nhu logic truoc do.

6. Co pending redirect truoc do:
   - Neu vua login bang mat khau reset, uu tien vao profile/setting.
   - Khong bi redirect sang trang cu dang cho.

7. Doi mat khau tren profile user:
   - Bam `Doi mat khau` -> form hien.
   - Confirm sai -> khong submit.
   - Confirm dung -> goi API, bao thanh cong, dong form.

8. Doi mat khau tren profile organizer:
   - Hanh vi giong user.

9. Doi mat khau tren setting admin:
   - Hanh vi giong user.

---

## 8) Luu y quan trong

- Toan bo luong tren su dung API BE co san.
- Co che force vao profile/setting chi kich hoat 1 lan cho email vua reset vi key `sessionStorage` duoc xoa sau khi xu ly.
- User, organizer va admin deu doi mat khau qua cung mot endpoint `PUT /api/user/profile`.
- `password` trong model User dang de `select: false`, vi vay login bat buoc phai `.select('+password')`.
- Hien tai backend doi mat khau trong DB truoc khi gui email. Neu gui email loi, password trong DB da bi doi roi. Day la hanh vi hien tai cua code can luu y khi van hanh.
