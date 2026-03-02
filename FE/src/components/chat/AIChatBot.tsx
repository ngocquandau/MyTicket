import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin } from 'antd';
import { SendOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

// --- IMPORT ICON TỪ ASSETS ---
import iconChat from '../../assets/iconchat.png';

// Interface cho tin nhắn AI
interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const AIChatBot: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Xin chào! Tôi là trợ lý ảo AI của MyTicket. Tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isAiTyping]);

  const toggleSupport = () => setIsSupportOpen(!isSupportOpen);
  const closeSupport = () => setIsSupportOpen(false);

  // Hàm định dạng văn bản (Chuyển Markdown của Google AI thành HTML)
  const formatMessage = (text: string) => {
    // Thay thế các dấu * ở đầu dòng thành dấu chấm bi (•)
    let formatted = text.replace(/^\*\s/gm, '• ');
    
    // Thay thế **văn bản** thành thẻ in đậm <strong>văn bản</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Trả về HTML an toàn để React render
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Hàm xử lý gửi tin nhắn cho AI
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    // 1. Thêm tin nhắn của User vào mảng giao diện
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      // 2. GỌI API ĐẾN BACKEND NODE.JS
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/api/chat`, { message: userText });      
      const aiResponseText = response.data.reply;

      // 3. Thêm câu trả lời của AI vào giao diện
      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText }]);
    } catch (error) {
      console.error('Chat API Error:', error);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Hệ thống AI đang bận hoặc mất kết nối máy chủ, vui lòng thử lại sau.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <>
      {/* --- WIDGET KHUNG CHAT (Góc phải dưới) --- */}
      <div 
        className={`fixed bottom-24 right-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-[0_5px_25px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 transform origin-bottom-right ${
          isSupportOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header Chat */}
        <div className="bg-[#23A6F0] text-white p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-full flex items-center justify-center w-10 h-10 shadow-inner">
              <img src={iconChat} alt="AI Avatar" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h3 className="m-0 text-white font-bold text-base leading-tight">Trợ lý AI - MyTicket</h3>
              <span className="text-xs text-blue-100 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                Luôn sẵn sàng hỗ trợ
              </span>
            </div>
          </div>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={closeSupport} 
            className="text-white hover:bg-blue-600 hover:text-white rounded-full transition-colors"
          />
        </div>

        {/* Vùng hiển thị tin nhắn (Chat Window) */}
        <div 
          ref={chatBodyRef}
          className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] flex flex-col gap-4 scroll-smooth"
        >
          {chatMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar phụ cho AI trong khung chat */}
              {msg.sender === 'ai' && (
                <img src={iconChat} alt="AI" className="w-10 h-10 rounded-full mr-2 self-end shadow-sm border border-gray-200" />
              )}
              
              {/* Bong bóng tin nhắn */}
              <div 
                className={`max-w-[80%] px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-[#23A6F0] text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                }`}
              >
                {/* Gọi hàm formatMessage để render HTML */}
                {msg.sender === 'ai' ? formatMessage(msg.text) : msg.text}
              </div>
            </div>
          ))}
          
          {/* Hiệu ứng AI đang gõ */}
          {isAiTyping && (
            <div className="flex justify-start items-center">
              <img src={iconChat} alt="AI" className="w-8 h-8 rounded-full mr-2 self-end shadow-sm border border-gray-200 opacity-70" />
              <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-2">
                <Spin size="small" />
                <span className="text-xs text-gray-400 font-medium">AI đang suy nghĩ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Vùng nhập liệu (Input Bar) */}
        <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="Hỏi AI về sự kiện, giá vé..."
            className="rounded-full bg-gray-50 border-gray-200 focus:bg-white hover:bg-white"
            size="large"
            disabled={isAiTyping}
          />
          <Button 
            type="primary" 
            shape="circle" 
            size="large"
            icon={<SendOutlined />} 
            onClick={handleSendMessage}
            loading={isAiTyping}
            className="bg-[#23A6F0] shadow-md flex-shrink-0"
          />
        </div>
      </div>

      {/* --- NÚT FLOAT ICON (Nút Tròn Góc Dưới) --- */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          shape="circle"
          onClick={toggleSupport}
          // Giữ nguyên shadow và các hiệu ứng khác
          className="shadow-[0_8px_20px_rgba(35,166,240,0.4)] flex items-center justify-center p-0 overflow-hidden hover:scale-110 transition-transform duration-300 border-2 border-white"
          style={{ width: '60px', height: '60px', backgroundColor: 'white' }} 
          aria-label="Toggle AI Chatbot"
        >
          {/* Sử dụng Icon Custom của bạn */}
          <img 
            src={iconChat} 
            alt="Open Chat" 
            // CHỈNH SỬA TẠI ĐÂY: Tăng w-full h-full để ảnh to ra,object-contain giữ nguyên tỷ lệ ảnh
            className="w-full h-full object-contain drop-shadow-md" 
          />
        </Button>
      </div>
    </>
  );
};

export default AIChatBot;