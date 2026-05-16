# 🔐 Phương Án Bảo Mật Thông Tin Vé Thanh Toán

## 📋 Tình Trạng Hiện Tại

### ✅ Điểm Mạnh Hiện Tại
- ✔️ Kiểm tra trạng thái thanh toán (`paymentStatus === 'paid'`)
- ✔️ Sử dụng tham số `ref` (ticketRef) thay vì chỉ ticketId
- ✔️ Endpoint công khai không yêu cầu authentication
- ✔️ Có mô hình phân quyền cơ bản

### ⚠️ Rủi Ro Bảo Mật Hiện Tại
1. **Enumeration Attack**: Attacker có thể brute-force `ticketId` để tìm vé
2. **Không có Rate Limiting**: Có thể spam request tìm kiếm thông tin
3. **Thông tin nhạy cảm bị lộ**: Email, số điện thoại người mua được trả về công khai
4. **Không có Time-Based Access**: Vé hiển thị vĩnh viễn, không có thời hạn hết hạn
5. **Không có Audit Log**: Không theo dõi ai xem vé khi nào
6. **Lack of Data Obfuscation**: TicketId dễ đoán được từ pattern

---

## 🛡️ Phương Án Bảo Mật Đề Xuất (3 Tầng)

### **Tầng 1: Tăng Cường Cơ Chế Xác Thực & Phân Quyền**

#### 1.1 - Triển Khai Token-Based Access (Bắt Buộc)
**Mục đích**: Chỉ người mua hoặc người được chia sẻ mới có quyền xem vé

```javascript
// Backend: Tạo secure access token khi người dùng thanh toán
import crypto from 'crypto';

const generateTicketAccessToken = (ticketId, purchaseId) => {
  // Token bao gồm: ticketId + purchaseId + random string + timestamp
  const data = `${ticketId}:${purchaseId}:${Date.now()}`;
  const token = crypto
    .createHash('sha256')
    .update(data + process.env.TICKET_TOKEN_SECRET)
    .digest('hex');
  
  return token; // Ví dụ: abc123def456...
};

// Lưu token mapping trong Redis hoặc DB
// ticket_token:{token} => { ticketId, purchaseId, createdAt, expiresAt }
```

#### 1.2 - Endpoint Xác Thực Người Dùng
**Thay đổi flow**:
- ✅ Khi mua xong → Gửi email với unique access token
- ✅ URL trở thành: `/ticket-info?token=<access_token>`
- ✅ Thay vì: `/ticket-info/ticketId?ref=ticketRef`

```javascript
// purchaseRoutes.js
// Cũ (không an toàn):
router.get('/tickets/:ticketId/public', getPaidTicketPublicInfo);

// Mới (an toàn):
router.get('/tickets/verify/:accessToken', verifyTicketAccess);
```

#### 1.3 - Xác Thực Chủ Sở Hữu Vé
```javascript
export const verifyTicketAccess = async (req, res) => {
  try {
    const { accessToken } = req.params;
    
    // Lấy thông tin token từ Redis/Cache
    const cachedToken = await redis.get(`ticket_token:${accessToken}`);
    
    if (!cachedToken) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' });
    }
    
    const { ticketId, purchaseId, expiresAt } = JSON.parse(cachedToken);
    
    // Kiểm tra hết hạn
    if (new Date() > new Date(expiresAt)) {
      await redis.del(`ticket_token:${accessToken}`);
      return res.status(401).json({ error: 'Token đã hết hạn' });
    }
    
    // Lấy thông tin vé
    const ticketData = await getTicketInfo(ticketId);
    
    // Ghi log truy cập
    await logTicketAccess({
      ticketId,
      accessToken,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      accessedAt: new Date()
    });
    
    return res.json(ticketData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
```

---

### **Tầng 2: Bảo Vệ Dữ Liệu Nhạy Cảm**

#### 2.1 - Che Giấu Thông Tin Nhạy Cảm (PII)
```javascript
// purchaseController.js
const maskPersonalInfo = (info) => ({
  // Email: user@example.com → u***@example.com
  email: info.email?.replace(/(.{1})(.*)(@.*)/, '$1***$3') || '',
  
  // Phone: 0912345678 → 0912****78
  phoneNumber: info.phoneNumber?.replace(/(\d{4})(\d+)(\d{2})/, '$1****$3') || '',
  
  // Name: Nguyễn Văn A → Nguyễn V***
  name: info.name 
    ? info.name.split(' ').map((part, i) => 
        i === 0 ? part : part[0] + '*'.repeat(part.length - 1)
      ).join(' ')
    : ''
});

export const getPaidTicketPublicInfo = async (req, res) => {
  // ... existing code ...
  
  // Thay vì trả full info:
  // buyer: {
  //   name: 'Nguyễn Văn A',
  //   email: 'user@example.com',
  //   phoneNumber: '0912345678'
  // }
  
  // Trả che giấu:
  buyer: maskPersonalInfo({
    name: buyerName,
    email: buyer.email,
    phoneNumber: buyer.phoneNumber
  })
};
```

#### 2.2 - Encryption Dữ Liệu Nhạy Cảm
```javascript
import crypto from 'crypto';

const encryptSensitiveData = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Lưu thông tin người mua dưới dạng encrypted
const buyerEncrypted = encryptSensitiveData(buyer);
// Chỉ trả về masked info cho public endpoint
```

#### 2.3 - Chỉ Hiển Thị Thông Tin Cần Thiết
```javascript
// Cũ: Trả quá nhiều thông tin
return res.json({
  ticketId: ticket.ticketId,
  seat: ticket.seat,
  seatType: ticket.ticketClass?.seatType,
  ticketClass: { name, price },
  event: { title, startDateTime, location, status },
  payment: { status, method, quantity, totalAmount, purchasedAt },
  buyer: { name, email, phoneNumber }  // ⚠️ Không cần công khai
});

// Mới: Chỉ thông tin cần thiết để check-in
return res.json({
  ticketId: ticket.ticketId,
  seat: ticket.seat,
  seatType: ticket.ticketClass?.seatType,
  ticketClass: { name },  // Bỏ price
  event: {
    title,
    startDateTime,
    location: { address },  // Bỏ tọa độ GPS
    status
  },
  payment: {
    status,
    purchasedAt,
    totalAmount  // Tuỳ chọn: có thể ẩn
  }
  // Bỏ hoàn toàn: buyer info, method, quantity
});
```

---

### **Tầng 3: Rate Limiting & DDoS Protection**

#### 3.1 - Triển Khai Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const redisClient = redis.createClient();

const ticketAccessLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:ticket-access:'
  }),
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 30,                    // Tối đa 30 request
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Không áp dụng cho authenticated users
    return req.user && req.user.isAdmin;
  }
});

router.get('/tickets/verify/:accessToken', ticketAccessLimiter, verifyTicketAccess);
```

#### 3.2 - IP-Based Throttling
```javascript
// Giới hạn số lần xem vé từ 1 IP trong khoảng thời gian
const ipThrottle = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'ip-throttle:'
  }),
  windowMs: 60 * 60 * 1000,  // 1 giờ
  max: 100,                   // 100 request/giờ từ 1 IP
  keyGenerator: (req) => req.ip,
  skip: (req) => req.user?.isAdmin
});

router.get('/tickets/verify/:accessToken', ipThrottle, verifyTicketAccess);
```

#### 3.3 - Detect Brute Force
```javascript
import { RedisClient } from 'redis';

export const detectBruteForceAttempt = async (req, res, next) => {
  const accessToken = req.params.accessToken;
  const ip = req.ip;
  const key = `brute-force:${ip}:${accessToken}`;
  
  const attempts = await redis.incr(key);
  await redis.expire(key, 300); // 5 phút
  
  if (attempts > 5) {
    // Log suspicious activity
    await logSecurityEvent({
      type: 'BRUTE_FORCE_DETECTED',
      ip,
      accessToken,
      attempts,
      timestamp: new Date()
    });
    
    return res.status(429).json({
      error: 'Quá nhiều nỗ cố xem vé, tài khoản tạm bị khóa',
      retryAfter: 300
    });
  }
  
  next();
};
```

---

### **Tầng 4: Time-Based Access & Session Management**

#### 4.1 - Hạn Chế Thời Gian Xem Vé
```javascript
const TICKET_ACCESS_WINDOW = {
  beforeEvent: 30 * 24 * 60 * 60 * 1000,  // 30 ngày trước sự kiện
  afterEvent: 7 * 24 * 60 * 60 * 1000     // 7 ngày sau sự kiện
};

export const generateTicketAccessToken = (ticket, expiryConfig = TICKET_ACCESS_WINDOW) => {
  const eventStart = new Date(ticket.ticketClass.event.startDateTime);
  
  const expiresAt = new Date(
    Math.min(
      eventStart.getTime() + expiryConfig.afterEvent,
      Date.now() + 90 * 24 * 60 * 60 * 1000  // Tối đa 90 ngày
    )
  );
  
  // Token có expiration time tích hợp
  return {
    token: generateSecureToken(),
    expiresAt: expiresAt.toISOString()
  };
};

// Kiểm tra trong verifyTicketAccess
if (new Date() > new Date(tokenData.expiresAt)) {
  return res.status(401).json({ error: 'Vé đã hết hạn xem' });
}
```

#### 4.2 - One-Time Token Option
```javascript
// Tuỳ chọn: Token chỉ dùng 1 lần (cho in vé)
export const generateOneTimeTicketToken = (ticket) => {
  const token = generateSecureToken();
  
  await redis.setex(
    `one-time-ticket:${token}`,
    300,  // 5 phút
    JSON.stringify({ ticketId: ticket._id, used: false })
  );
  
  return token;
};

export const verifyOneTimeTicketToken = async (token) => {
  const data = await redis.get(`one-time-ticket:${token}`);
  
  if (!data) {
    return { valid: false, error: 'Token không tồn tại' };
  }
  
  const parsed = JSON.parse(data);
  
  if (parsed.used) {
    return { valid: false, error: 'Token đã được sử dụng' };
  }
  
  // Mark as used
  parsed.used = true;
  await redis.setex(`one-time-ticket:${token}`, 300, JSON.stringify(parsed));
  
  return { valid: true, ticketId: parsed.ticketId };
};
```

---

### **Tầng 5: Audit & Monitoring**

#### 5.1 - Comprehensive Audit Logging
```javascript
// Models/TicketAccessLog.js
const ticketAccessLogSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  ipAddress: String,
  userAgent: String,
  accessMethod: {
    type: String,
    enum: ['web', 'mobile_app', 'email_link', 'qr_scan'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'unauthorized', 'expired', 'blocked'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  geoLocation: {
    country: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }
}, { collection: 'ticket_access_logs' });

export default mongoose.model('TicketAccessLog', ticketAccessLogSchema);
```

#### 5.2 - Alert on Suspicious Activity
```javascript
export const analyzeTicketAccess = async (logEntry) => {
  // Kiểm tra multiple access từ khác IP trong 5 phút
  const recentAccesses = await TicketAccessLog.find({
    ticket: logEntry.ticket,
    timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  });
  
  const uniqueIPs = new Set(recentAccesses.map(log => log.ipAddress));
  
  if (uniqueIPs.size > 3) {
    await sendSecurityAlert({
      type: 'SUSPICIOUS_TICKET_ACCESS',
      ticketId: logEntry.ticket,
      ips: Array.from(uniqueIPs),
      accessCount: recentAccesses.length,
      severity: 'HIGH'
    });
  }
  
  // Kiểm tra geo anomaly
  const lastAccess = recentAccesses[recentAccesses.length - 1];
  if (lastAccess && logEntry.geoLocation) {
    const distance = calculateDistance(
      lastAccess.geoLocation,
      logEntry.geoLocation
    );
    
    const timeDiff = (logEntry.timestamp - lastAccess.timestamp) / 1000; // giây
    const possibleSpeed = distance / timeDiff;
    
    // Nếu tốc độ > 900 km/giờ (tốc độ máy bay), đáng ngờ
    if (possibleSpeed > 250) {
      await sendSecurityAlert({
        type: 'IMPOSSIBLE_TRAVEL',
        ticketId: logEntry.ticket,
        from: lastAccess.geoLocation,
        to: logEntry.geoLocation,
        speed: possibleSpeed,
        severity: 'CRITICAL'
      });
    }
  }
};
```

---

## 📊 So Sánh: Trước & Sau

| Tiêu Chí | Hiện Tại | Sau Cải Thiện |
|---------|---------|-------------|
| **Xác Thực** | Không yêu cầu | Token-based + 2FA |
| **Enumeration Risk** | Cao (dễ brute-force) | Rất thấp (token unique) |
| **Rate Limiting** | Không | ✅ 30 req/15 phút |
| **PII Exposure** | Công khai | ✅ Che giấu/Encrypted |
| **Time-Based Access** | Vĩnh viễn | ✅ 30 ngày trước + 7 ngày sau |
| **Audit Trail** | Không | ✅ Đầy đủ logging |
| **Brute Force Detection** | Không | ✅ Tự động detect & block |
| **Geo Anomaly** | Không | ✅ Tự động alert |
| **Compliance** | Không | ✅ GDPR, PCI-DSS Ready |

---

## 🚀 Lộ Trình Triển Khai

### Phase 1 (Tuần 1-2): Cơ Sở
- [ ] Triển khai Redis caching
- [ ] Tạo secure token generation
- [ ] Setup rate limiting
- [ ] Thêm audit logging

### Phase 2 (Tuần 3-4): Nâng Cao
- [ ] Che giấu PII
- [ ] Encryption dữ liệu nhạy cảm
- [ ] Time-based access
- [ ] Detect brute-force

### Phase 3 (Tuần 5-6): Monitoring
- [ ] Geo-location tracking
- [ ] Real-time alerts
- [ ] Admin dashboard
- [ ] Security reports

---

## 🔧 Dependency Cần Thiết

```json
{
  "dependencies": {
    "express-rate-limit": "^6.x",
    "rate-limit-redis": "^3.x",
    "redis": "^4.x",
    "crypto": "builtin",
    "geoip2": "^2.x"
  }
}
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Bảo Mật Dữ Liệu Secret**
   - Lưu `TICKET_TOKEN_SECRET`, `ENCRYPTION_KEY` trong `.env`
   - Rotate key định kỳ
   - Không commit vào git

2. **GDPR Compliance**
   - Xóa log truy cập sau 90 ngày
   - Cho phép user xóa dữ liệu cá nhân
   - Document data processing

3. **Performance**
   - Cache token validation trong Redis
   - Index các trường log access
   - Monitor Redis memory usage

4. **User Experience**
   - Email link không hết hạn (token hợp lệ)
   - Clear error messages
   - Fallback cho offline access

5. **Testing**
   - Unit test token generation
   - Load test rate limiting
   - Penetration testing
   - Audit security log

---

## 📧 Email Template Mới

```html
<h2>Thông Tin Vé Của Bạn</h2>
<p>Vé của bạn đã sẵn sàng! Nhấp vào link dưới để xem:</p>
<a href="https://mticket.vercel.app/ticket-info?token=xyz123...">
  Xem Vé Của Tôi
</a>
<p style="font-size: 12px; color: #666;">
  ⏰ Link hợp lệ đến: {event.startDateTime + 7 ngày}<br>
  🔒 Không chia sẻ link này với người khác<br>
  📱 Giữ màn hình mở tại cổng check-in
</p>
```

---

## 🎯 KPI Theo Dõi

- **Ticket Access Attempts**: Số lần truy cập vé/ngày
- **Failed Access Rate**: % truy cập bị từ chối
- **Brute Force Attempts**: Số lần detect brute-force/tuần
- **Unauthorized Access**: Số lần cố truy cập không hợp lệ
- **Average Access Time**: Thời gian từ thanh toán đến xem vé

---

*Cập nhật lần cuối: 2026-05-16*
