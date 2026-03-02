import { GoogleGenerativeAI } from '@google/generative-ai';
import Event from '../models/Event.js'; 
import TicketClass from '../models/TicketClass.js'; // Import thêm model TicketClass

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateChatResponse = async (userMessage) => {
  try {
    // 1. Lấy 30 sự kiện ĐANG MỞ BÁN (status: 'published') gần nhất
    const events = await Event.find({ status: 'published' })
                              .sort({ startDateTime: 1 })
                              .limit(30)
                              .lean(); // Dùng .lean() để dễ xử lý data
    
    // Lấy ID của các sự kiện này
    const eventIds = events.map(ev => ev._id);

    // 2. Tìm tất cả các loại vé (TicketClass) thuộc về các sự kiện trên
    const ticketClasses = await TicketClass.find({ event: { $in: eventIds } }).lean();

    // 3. Gom nhóm vé theo từng sự kiện
    const ticketsByEvent = {};
    ticketClasses.forEach(tc => {
        if (!ticketsByEvent[tc.event]) {
            ticketsByEvent[tc.event] = [];
        }
        ticketsByEvent[tc.event].push(tc);
    });

    // 4. Định dạng dữ liệu thành chuỗi Context cho AI đọc
    let eventsContext = "Hiện tại hệ thống chưa có sự kiện nào đang mở bán.";
    if (events && events.length > 0) {
      eventsContext = events.map(ev => {
        // Xử lý ngày tháng
        const startTime = ev.startDateTime ? new Date(ev.startDateTime).toLocaleString('vi-VN') : 'Chưa cập nhật';
        const address = (ev.location && ev.location.address) ? ev.location.address : 'Chưa cập nhật';
        
        // Xử lý danh sách giá vé
        const tcs = ticketsByEvent[ev._id] || [];
        let priceInfo = 'Chưa có thông tin vé';
        if (tcs.length > 0) {
            priceInfo = tcs.map(tc => `${tc.name}: ${tc.price.toLocaleString('vi-VN')} VND`).join(' | ');
        }

        return `- Tên sự kiện: ${ev.title}
  Thể loại: ${ev.genre}
  Thời gian: ${startTime}
  Địa điểm: ${address}
  Giới hạn tuổi: ${ev.ageLimit > 0 ? ev.ageLimit + '+' : 'Không giới hạn'}
  Các loại vé & giá: ${priceInfo}`;
      }).join('\n\n');
    }

    // 5. CẤU HÌNH PROMPT CHO AI
    const systemInstruction = `
      Bạn là trợ lý ảo AI của hệ thống đặt vé sự kiện MyTicket.
      Nhiệm vụ của bạn là tư vấn các sự kiện, giá vé, địa điểm cho khách hàng.
      
      LƯU Ý QUAN TRỌNG VỀ GIÁ TIỀN:
      - Khách hàng thường viết tắt chữ "k" để chỉ nghìn đồng (VD: 500k = 500.000 VND).
      - Nếu khách yêu cầu tìm sự kiện "rẻ hơn 500k", hãy tự động đối chiếu với giá vé trong danh sách để liệt kê các sự kiện phù hợp.
      
      Danh sách sự kiện hiện tại đang mở bán:
      ${eventsContext}
      
      Luôn trả lời ngắn gọn, thân thiện, trình bày đẹp mắt (dùng gạch đầu dòng) và bằng tiếng Việt.
      Nếu không có thông tin phù hợp, hãy xin lỗi khéo léo.
    `;

    // 6. GỌI AI
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: systemInstruction 
    });

    const result = await model.generateContent(userMessage);
    return result.response.text();

  } catch (error) {
    console.error("Lỗi khi gọi Google Gemini API:", error);
    throw new Error("Không thể xử lý yêu cầu AI lúc này.");
  }
};