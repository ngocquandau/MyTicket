# Tai lieu chuc nang "Su kien danh cho ban" - HomePage

## 1. Muc tieu
Muc "Su kien danh cho ban" hien thi tren HomePage khi nguoi dung dang nhap thanh cong voi role `user`.
Danh sach duoc ca nhan hoa dua tren model recommendation va du lieu tuong tac.

## 2. Dieu kien hien thi tren HomePage
- Hien thi block "Su kien danh cho ban" khi `role === 'user'`.
- Khong hien thi block nay voi `admin`, `organizer`, hoac khach chua dang nhap.

## 3. Luong goi API

### 3.1 API can goi
1. Lay danh sach su kien tong de render card day du:
   - `GET /api/event`
2. Lay danh sach recommendation theo user dang nhap:
   - `GET /api/model/recommended-list`
   - Yeu cau `Authorization: Bearer <token>`

### 3.2 Cach ghep du lieu
- API recommendation tra ve danh sach xep hang (thuong gom `_id`, `title`, `score`).
- FE can ghep danh sach recommendation voi du lieu su kien tu `GET /api/event` theo `_id` de co du thong tin card:
  - `posterURL`, `location`, `startDateTime`, `tickets`, ...
- Thu tu hien thi cua "Su kien danh cho ban" phai theo thu tu score recommendation (giam dan).

## 4. Cac trang thai hien thi can xu ly

### 4.1 Dang tai du lieu
- Hien thi trang thai loading: "Dang tai goi y phu hop cho ban..."

### 4.2 Co du lieu recommendation
- Hien thi toi da 6 card dau tren HomePage.
- Nut "KHAM PHA NGAY >>>" dieu huong den:
  - `/search?recommended=1`

### 4.3 Khong co du lieu recommendation
- Hien thong diep fallback than thien:
  - "Chua co du du lieu de de xuat su kien phu hop."
- Hien nut dieu huong nguoi dung di kham pha su kien:
  - `/search?all=1`

## 5. Xu ly theo tung loai tai khoan

### Truong hop 1: Tai khoan moi tao
Dac diem:
- Thuong chua co hoac rat it interaction (`click`, `purchase`).
- Cac chi so chi tieu (`totalSpent`, `totalTicketsPurchase`, `avgPurchasePrice`) gan nhu bang 0.

Xu ly de xuat:
1. FE van goi recommendation API neu da dang nhap.
2. Neu ket qua rong hoac score rat thap:
   - Hien fallback UI (khuyen khich kham pha).
3. Uu tien huong nguoi dung den danh sach tat ca de tao hanh vi ban dau.

### Truong hop 2: Tai khoan da tao mot thoi gian
Dac diem:
- Da co lich su click/mua.
- Co kha nang nhan duoc ket qua recommendation on dinh hon.

Xu ly de xuat:
1. Goi day du luong recommendation + merge event details.
2. Hien thi danh sach theo score.
3. Neu model tam thoi loi, su dung fallback (xem muc 6) de khong lam mat toan bo block.

## 6. Cac loi thuong gap va cach xu ly

### 6.1 401/403
Nguyen nhan:
- Token thieu, het han, hoac khong hop le.

Xu ly:
- FE bat loi va hien fallback UI (khong lam crash HomePage).
- Dieu huong nguoi dung dang nhap lai neu can.

### 6.2 422 tu recommendation server
Nguyen nhan thuong gap:
- Payload feature khong hop le (null/NaN/kieu du lieu sai).

Xu ly backend khuyen nghi:
- Chuan hoa feature ve so hop le truoc khi goi model.
- Neu van 422, tra fallback list de FE van co du lieu hien thi.

### 6.3 Timeout hoac model sleep
Nguyen nhan:
- HF Space chua wake hoac response cham.

Xu ly:
- Retry co gioi han so lan.
- Neu qua so lan retry, tra fallback an toan.

## 7. Checklist test nghiem thu

### Test voi tai khoan moi
1. Dang nhap tai khoan moi tao.
2. Vao HomePage.
3. Kiem tra block "Su kien danh cho ban" co hien thi.
4. Kiem tra fallback thong diep va nut dieu huong hoat dong dung.

### Test voi tai khoan da co lich su
1. Dang nhap tai khoan co interaction/mua ve truoc do.
2. Vao HomePage.
3. Kiem tra danh sach recommendation hien thi dung thu tu va du thong tin card.
4. Bam "KHAM PHA NGAY >>>" va xac nhan trang `/search?recommended=1` tai du lieu dung.

## 8. Ghi chu implementation
- HomePage chi hien thi section recommendation cho role `user`.
- Search page can ho tro query `recommended=1` de mo rong danh sach recommendation.
- Luon uu tien trai nghiem "co du lieu de hien thi" thay vi fail cung khi model gap su co tam thoi.
