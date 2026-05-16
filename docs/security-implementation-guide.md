# 🛠️ Hướng Dẫn Triển Khai Bảo Mật Vé

## 1. Setup Environment & Dependencies

### Bước 1: Cài đặt packages cần thiết
```bash
cd BE
npm install express-rate-limit rate-limit-redis redis crypto geoip2 jwt-simple
npm install --save-dev @types/redis
```

### Bước 2: Cấu hình .env
```env
# .env
TICKET_TOKEN_SECRET=your_long_random_secret_key_min_32_chars_here
ENCRYPTION_KEY=your_32_bytes_hex_encryption_key_here
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_redis_password
JWT_SECRET=your_jwt_secret_key_here
```

### Bước 3: Khởi tạo Redis Connection
**File: `BE/config/redis.js`**
```javascript
import redis from 'redis';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Redis connected'));

await redisClient.connect();

export default redisClient;
```

---

## 2. Tạo Security Utilities

### Bước 1: Token Generation Utility
**File: `BE/utils/tokenUtils.js`**
```javascript
import crypto from 'crypto';
import redisClient from '../config/redis.js';

const TOKEN_EXPIRY_HOURS = 24 * 30; // 30 ngày
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * Tạo access token an toàn cho vé
 * @param {Object} ticket - Ticket object
 * @param {Object} purchase - Purchase object
 * @returns {Promise<string>} Access token
 */
export const generateTicketAccessToken = async (ticket, purchase) => {
  try {
    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    
    // Lưu token mapping trong Redis
    const tokenData = {
      ticketId: ticket._id.toString(),
      purchaseId: purchase._id.toString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      isUsed: false
    };
    
    // TTL = 30 ngày trong giây
    const ttl = TOKEN_EXPIRY_HOURS * 3600;
    await redisClient.setEx(
      `ticket_token:${token}`,
      ttl,
      JSON.stringify(tokenData)
    );
    
    console.log(`✅ Token generated: ${token.substring(0, 10)}...`);
    return token;
  } catch (error) {
    console.error('❌ Error generating token:', error);
    throw error;
  }
};

/**
 * Xác minh access token
 * @param {string} token - Access token
 * @returns {Promise<Object>} Token data if valid
 */
export const verifyTicketAccessToken = async (token) => {
  try {
    const cachedToken = await redisClient.get(`ticket_token:${token}`);
    
    if (!cachedToken) {
      return { valid: false, error: 'Token không tồn tại hoặc đã hết hạn' };
    }
    
    const tokenData = JSON.parse(cachedToken);
    
    // Kiểm tra hết hạn
    if (new Date() > new Date(tokenData.expiresAt)) {
      await redisClient.del(`ticket_token:${token}`);
      return { valid: false, error: 'Token đã hết hạn' };
    }
    
    // Kiểm tra đã sử dụng (tuỳ chọn)
    if (tokenData.isUsed) {
      return { valid: false, error: 'Token đã được sử dụng' };
    }
    
    return { valid: true, data: tokenData };
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    return { valid: false, error: 'Lỗi xác minh token' };
  }
};

/**
 * Che giấu thông tin cá nhân
 * @param {Object} info - Personal info
 * @returns {Object} Masked info
 */
export const maskPersonalInfo = (info) => {
  if (!info) return {};
  
  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    const masked = local.substring(0, 2) + '*'.repeat(Math.max(0, local.length - 3)) + '@' + domain;
    return masked;
  };
  
  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return '';
    return phone.substring(0, 4) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 2);
  };
  
  const maskName = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts
      .map((part, i) => i === 0 ? part : part[0] + '*'.repeat(Math.max(0, part.length - 1)))
      .join(' ');
  };
  
  return {
    email: maskEmail(info.email),
    phoneNumber: maskPhone(info.phoneNumber),
    name: maskName(info.name)
  };
};

/**
 * Mã hóa dữ liệu nhạy cảm
 * @param {Object} data - Data to encrypt
 * @returns {Object} { encrypted, iv, authTag }
 */
export const encryptData = (data) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('❌ Encryption error:', error);
    throw error;
  }
};

/**
 * Giải mã dữ liệu
 * @param {Object} encryptedData - { encrypted, iv, authTag }
 * @returns {Object} Decrypted data
 */
export const decryptData = (encryptedData) => {
  try {
    const { encrypted, iv: ivHex, authTag: authTagHex } = encryptedData;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('❌ Decryption error:', error);
    throw error;
  }
};
```

### Bước 2: Rate Limiting Middleware
**File: `BE/middleware/rateLimiter.js`**
```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis.js';

// Limiter cho ticket access
export const ticketAccessLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:ticket-access:',
  }),
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 request
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => {
    // Bỏ qua cho admin
    return req.user?.role === 'admin';
  }
});

// IP-based throttling
export const ipThrottle = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'ip-throttle:',
  }),
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 100,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  skip: (req) => req.user?.role === 'admin'
});

// Brute force detection
export const bruteForceLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'brute-force:',
  }),
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5,
  message: 'Quá nhiều nỗ cố không thành công, tài khoản tạm bị khóa',
  skip: (req) => req.user?.role === 'admin'
});
```

### Bước 3: Audit Logging
**File: `BE/utils/auditLogger.js`**
```javascript
import TicketAccessLog from '../models/TicketAccessLog.js';
import geoip from 'geoip2';

export const logTicketAccess = async (req, ticketId, status = 'success') => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Lấy thông tin địa lý (tuỳ chọn)
    let geoLocation = null;
    try {
      // Giả sử sử dụng MaxMind GeoIP2
      // geoLocation = await geoipLookup(ipAddress);
    } catch (err) {
      console.warn('Geo lookup failed:', err.message);
    }
    
    const log = new TicketAccessLog({
      ticket: ticketId,
      ipAddress,
      userAgent: req.get('user-agent'),
      accessMethod: req.query.method || 'web',
      status,
      timestamp: new Date(),
      geoLocation
    });
    
    await log.save();
    console.log(`📋 Access logged: ${ticketId} - ${status}`);
  } catch (error) {
    console.error('❌ Logging error:', error);
    // Không throw - logging failure không nên block request
  }
};

export const detectSuspiciousActivity = async (ticketId) => {
  try {
    // Lấy 10 lần access gần đây
    const recentAccesses = await TicketAccessLog.find({
      ticket: ticketId,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // 1 giờ
    }).sort({ timestamp: -1 }).limit(10);
    
    if (recentAccesses.length < 2) return null;
    
    // Kiểm tra unique IP addresses
    const uniqueIPs = new Set(recentAccesses.map(log => log.ipAddress));
    if (uniqueIPs.size > 5) {
      return {
        type: 'MULTIPLE_IPS',
        severity: 'HIGH',
        ips: Array.from(uniqueIPs),
        count: recentAccesses.length
      };
    }
    
    // Kiểm tra multiple failed attempts
    const failedAttempts = recentAccesses.filter(log => 
      ['unauthorized', 'expired', 'blocked'].includes(log.status)
    );
    if (failedAttempts.length > 3) {
      return {
        type: 'MULTIPLE_FAILED_ATTEMPTS',
        severity: 'MEDIUM',
        attempts: failedAttempts.length
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Suspicious activity detection error:', error);
    return null;
  }
};
```

---

## 3. Cập Nhật Backend Controllers

### Bước 1: Cập nhật Purchase Controller
**File: `BE/controllers/purchaseController.js`**

Thêm hàm mới:
```javascript
import { 
  generateTicketAccessToken,
  maskPersonalInfo,
  encryptData 
} from '../utils/tokenUtils.js';
import { logTicketAccess, detectSuspiciousActivity } from '../utils/auditLogger.js';

/**
 * Sau khi thanh toán thành công, tạo access token
 */
export const createTicketAccessToken = async (req, res) => {
  try {
    const { ticketId, purchaseId } = req.body;
    
    const ticket = await Ticket.findById(ticketId);
    const purchase = await Purchase.findById(purchaseId);
    
    if (!ticket || !purchase) {
      return res.status(404).json({ error: 'Ticket hoặc purchase không tồn tại' });
    }
    
    if (purchase.paymentStatus !== 'paid') {
      return res.status(403).json({ error: 'Purchase chưa thanh toán' });
    }
    
    // Tạo access token
    const accessToken = await generateTicketAccessToken(ticket, purchase);
    
    // Trả về token để gửi trong email
    return res.json({
      accessToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating access token:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * API công khai để xem thông tin vé (sử dụng access token)
 */
export const getPaidTicketPublicInfo = async (req, res) => {
  try {
    const { accessToken } = req.params;
    
    // 1. Verify token
    const tokenVerification = await verifyTicketAccessToken(accessToken);
    if (!tokenVerification.valid) {
      await logTicketAccess(req, null, 'unauthorized');
      return res.status(401).json({ error: tokenVerification.error });
    }
    
    const { ticketId, purchaseId } = tokenVerification.data;
    
    // 2. Lấy ticket info
    const ticket = await Ticket.findById(ticketId).populate([
      {
        path: 'ticketClass',
        select: 'name seatType event',
        populate: {
          path: 'event',
          select: 'title startDateTime location status'
        }
      },
      {
        path: 'purchase',
        select: 'paymentStatus createdAt purchaseDate totalAmount user',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      }
    ]);
    
    if (!ticket) {
      await logTicketAccess(req, ticketId, 'not_found');
      return res.status(404).json({ error: 'Ticket không tồn tại' });
    }
    
    if (ticket.purchase.paymentStatus !== 'paid') {
      await logTicketAccess(req, ticketId, 'unauthorized');
      return res.status(403).json({ error: 'Ticket chưa thanh toán' });
    }
    
    // 3. Ghi log truy cập
    await logTicketAccess(req, ticketId, 'success');
    
    // 4. Kiểm tra hoạt động đáng ngờ
    const suspiciousActivity = await detectSuspiciousActivity(ticketId);
    if (suspiciousActivity?.severity === 'CRITICAL') {
      console.warn('⚠️ Critical suspicious activity:', suspiciousActivity);
      // Gửi alert nếu cần
    }
    
    // 5. Trả về dữ liệu (chỉ cần thiết, che giấu PII)
    const buyer = ticket.purchase.user || {};
    
    return res.json({
      ticketId: ticket.ticketId,
      seat: ticket.seat,
      seatType: ticket.ticketClass?.seatType || 'general',
      ticketClass: {
        name: ticket.ticketClass?.name || ''
      },
      event: {
        title: ticket.ticketClass?.event?.title || '',
        startDateTime: ticket.ticketClass?.event?.startDateTime,
        location: ticket.ticketClass?.event?.location,
        status: ticket.ticketClass?.event?.status
      },
      payment: {
        status: ticket.purchase.paymentStatus,
        purchasedAt: ticket.purchase.purchaseDate || ticket.purchase.createdAt,
        totalAmount: ticket.purchase.totalAmount
      },
      // Chỉ trả về thông tin người mua bị che giấu
      buyer: maskPersonalInfo({
        name: [buyer.lastName, buyer.firstName].filter(Boolean).join(' '),
        email: buyer.email,
        phoneNumber: buyer.phoneNumber
      })
    });
  } catch (error) {
    console.error('❌ Error getting ticket info:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Lấy QR code (cũng cần verify token)
 */
export const getPaidTicketQRCode = async (req, res) => {
  try {
    const { accessToken } = req.params;
    
    // Verify token
    const tokenVerification = await verifyTicketAccessToken(accessToken);
    if (!tokenVerification.valid) {
      await logTicketAccess(req, null, 'unauthorized');
      return res.status(401).json({ error: tokenVerification.error });
    }
    
    const { ticketId } = tokenVerification.data;
    
    // Lấy ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket không tồn tại' });
    }
    
    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(ticket.ticketId, {
      type: 'image/png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    
    res.type('image/png');
    return res.send(qrBuffer);
  } catch (error) {
    console.error('❌ Error generating QR:', error);
    return res.status(500).json({ error: error.message });
  }
};
```

---

## 4. Cập Nhật Routes

**File: `BE/routes/purchaseRoutes.js`**

```javascript
import express from 'express';
import {
  createTicketAccessToken,
  getPaidTicketPublicInfo,
  getPaidTicketQRCode,
  // ... controller khác
} from '../controllers/purchaseController.js';
import { 
  ticketAccessLimiter, 
  ipThrottle 
} from '../middleware/rateLimiter.js';
import { bruteForceLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Tạo access token (chỉ sau khi thanh toán)
router.post('/tickets/generate-token', createTicketAccessToken);

// Lấy thông tin vé công khai (có rate limiting)
router.get(
  '/tickets/:accessToken/public',
  bruteForceLimiter,
  ticketAccessLimiter,
  ipThrottle,
  getPaidTicketPublicInfo
);

// Lấy QR code (có rate limiting)
router.get(
  '/tickets/:accessToken/qr',
  ticketAccessLimiter,
  getPaidTicketQRCode
);

// ... routes khác
export default router;
```

---

## 5. Tạo Model cho Audit Log

**File: `BE/models/TicketAccessLog.js`**

```javascript
import mongoose from 'mongoose';

const ticketAccessLogSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: String,
  accessMethod: {
    type: String,
    enum: ['web', 'mobile_app', 'email_link', 'qr_scan'],
    default: 'web'
  },
  status: {
    type: String,
    enum: ['success', 'unauthorized', 'expired', 'blocked', 'not_found'],
    default: 'success',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    // Tự động xóa log sau 90 ngày
    expires: 90 * 24 * 60 * 60
  },
  geoLocation: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  }
}, {
  collection: 'ticket_access_logs'
});

// Index để query nhanh
ticketAccessLogSchema.index({ ticket: 1, timestamp: -1 });
ticketAccessLogSchema.index({ ipAddress: 1, timestamp: -1 });

const TicketAccessLog = mongoose.model('TicketAccessLog', ticketAccessLogSchema);
export default TicketAccessLog;
```

---

## 6. Cập Nhật Email Service

**File: `BE/services/emailService.js` - Hàm mới**

```javascript
import { generateTicketAccessToken } from '../utils/tokenUtils.js';

export const sendBookingConfirmationWithToken = async (purchase) => {
  try {
    const ticket = await Ticket.findOne({ purchase: purchase._id });
    
    // 1. Tạo access token
    const accessToken = await generateTicketAccessToken(ticket, purchase);
    
    // 2. Build secure URL
    const ticketInfoUrl = `${process.env.FRONTEND_URL}/ticket-info?token=${accessToken}`;
    
    // 3. Gửi email với link
    const emailHtml = `
      <h2>✅ Thanh Toán Thành Công</h2>
      <p>Vé của bạn đã sẵn sàng! Nhấp vào nút dưới để xem thông tin chi tiết:</p>
      <a href="${ticketInfoUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #1d84de;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
      ">
        🎫 Xem Vé Của Tôi
      </a>
      <p style="font-size: 12px; color: #666;">
        ⏰ Link hợp lệ trong 30 ngày<br>
        🔒 Không chia sẻ link này với người khác<br>
        📱 Giữ màn hình mở tại cổng check-in
      </p>
    `;
    
    await sendEmail({
      to: purchase.user.email,
      subject: '🎫 Vé của bạn đã sẵn sàng',
      html: emailHtml
    });
    
    console.log('✅ Confirmation email sent with secure token');
  } catch (error) {
    console.error('❌ Error sending confirmation:', error);
    throw error;
  }
};
```

---

## 7. Cập Nhật Frontend

### Bước 1: Cập nhật TicketInfoPage để sử dụng token

**File: `FE/src/services/purchaseService.ts`**

```typescript
export const getTicketByAccessTokenAPI = async (accessToken: string) => {
  const res = await axiosClient.get(
    `/purchases/tickets/${encodeURIComponent(accessToken)}/public`
  );
  return res.data;
};

export const downloadTicketQRByTokenAPI = async (accessToken: string) => {
  const res = await axiosClient.get(
    `/purchases/tickets/${encodeURIComponent(accessToken)}/qr`,
    { responseType: 'blob' }
  );
  return res.data;
};
```

### Bước 2: Cập nhật TicketInfoPage Component
**Thay đổi logic lấy dữ liệu:**

```typescript
React.useEffect(() => {
  const loadTicket = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Lấy token từ query params
      const urlParams = new URLSearchParams(location.search);
      const accessToken = urlParams.get('token');
      
      if (!accessToken) {
        setError('Token không hợp lệ');
        return;
      }
      
      // Gọi API với token
      const res = await getTicketByAccessTokenAPI(accessToken);
      setData(res);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Không thể xác thực thông tin vé';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  loadTicket();
}, [location.search]);
```

---

## 8. Testing & Validation

### Script Test Token Generation

**File: `BE/tests/token.test.js`**

```javascript
import { 
  generateTicketAccessToken,
  verifyTicketAccessToken,
  maskPersonalInfo 
} from '../utils/tokenUtils.js';

// Test 1: Token generation
console.log('Test 1: Token generation');
const testTicket = { _id: '507f1f77bcf86cd799439011' };
const testPurchase = { _id: '507f1f77bcf86cd799439012' };

const token = await generateTicketAccessToken(testTicket, testPurchase);
console.log('✅ Token created:', token.substring(0, 20) + '...');

// Test 2: Token verification
console.log('\nTest 2: Token verification');
const verification = await verifyTicketAccessToken(token);
console.log('✅ Token verified:', verification.valid);

// Test 3: PII masking
console.log('\nTest 3: PII masking');
const personalInfo = {
  name: 'Nguyễn Văn An',
  email: 'nguyenvan@example.com',
  phoneNumber: '0912345678'
};
const masked = maskPersonalInfo(personalInfo);
console.log('✅ Masked info:', masked);
// Output: { name: 'Nguyễn V***, email: 'n****@example.com', phoneNumber: '0912****78' }

// Test 4: Token expiry
console.log('\nTest 4: Token expiry');
await new Promise(resolve => setTimeout(resolve, 1100)); // Wait 1.1 seconds
const expiredVerification = await verifyTicketAccessToken(token);
console.log('✅ Expiry check:', !expiredVerification.valid);
```

Run:
```bash
node BE/tests/token.test.js
```

---

## 9. Deployment Checklist

- [ ] Redis server đã running
- [ ] .env variables đã set
- [ ] Dependencies đã cài
- [ ] Models đã migrate
- [ ] Email service đã test
- [ ] Routes đã register
- [ ] Frontend updated
- [ ] Rate limiting đã test
- [ ] Audit logs đã verify
- [ ] Security headers đã add (CORS, CSP, etc.)
- [ ] Load testing đã chạy
- [ ] Monitoring & alerting đã setup

---

## 10. Monitoring & Alerts

### Setup Basic Monitoring

**File: `BE/utils/securityMonitor.js`**

```javascript
import TicketAccessLog from '../models/TicketAccessLog.js';
import nodemailer from 'nodemailer';

export const monitorSecurityEvents = async () => {
  // Chạy mỗi 5 phút
  setInterval(async () => {
    try {
      // Kiểm tra failed attempts trong 5 phút qua
      const failedAttempts = await TicketAccessLog.countDocuments({
        status: { $in: ['unauthorized', 'expired', 'blocked'] },
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });
      
      if (failedAttempts > 20) {
        await sendSecurityAlert(
          `⚠️ High failed ticket access attempts: ${failedAttempts} in last 5 minutes`
        );
      }
      
      // Kiểm tra multiple IP access
      const multiIPAccess = await TicketAccessLog.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$ticket',
            uniqueIPs: { $push: '$ipAddress' },
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 5 }
          }
        }
      ]);
      
      if (multiIPAccess.length > 0) {
        await sendSecurityAlert(
          `⚠️ Tickets accessed from multiple IPs: ${multiIPAccess.length}`
        );
      }
    } catch (error) {
      console.error('❌ Monitoring error:', error);
    }
  }, 5 * 60 * 1000);
};

async function sendSecurityAlert(message) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SECURITY_ALERT_EMAIL,
      subject: '🚨 MyTicket Security Alert',
      text: message
    });
  } catch (error) {
    console.error('❌ Failed to send alert:', error);
  }
}
```

---

## ✅ Next Steps

1. ✅ Implement tầng 1-2 trước (Token & PII masking)
2. ✅ Test kỹ trước khi deploy
3. ✅ Monitor closely sau deployment
4. ✅ Gather user feedback
5. ✅ Implement tầng 3-5 dần dần

---

*Documentation by: Security Team*
*Last Updated: 2026-05-16*
