import { generateChatResponse } from '../services/geminiService.js';

export const handleChat = async (req, res) => {
  try {
    // Lấy nội dung tin nhắn do Frontend gửi lên
    const { message } = req.body;

    // Kiểm tra đầu vào
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng cung cấp nội dung câu hỏi." 
      });
    }

    // Chuyển câu hỏi cho AI xử lý
    const aiReply = await generateChatResponse(message);

    // Trả kết quả thành công về cho Frontend
    return res.status(200).json({
      success: true,
      reply: aiReply
    });

  } catch (error) {
    console.error("Lỗi tại chatController:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Hệ thống AI đang bận, vui lòng thử lại sau.",
      error: error.message 
    });
  }
};
