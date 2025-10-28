import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import './ChatBox.css';

function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn về size, màu sắc và chất liệu. Bạn cần tôi giúp gì?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm gọi AWS Bedrock API
  const callAWSBedrockAPI = async (userMessage) => {
    try {
      // TODO: Thay thế bằng endpoint API Gateway của bạn
      const API_ENDPOINT = process.env.REACT_APP_AWS_API_ENDPOINT || 'YOUR_API_GATEWAY_URL';
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          // Thêm context về shop
          context: 'Shop quần áo thời trang nam nữ, các dòng sản phẩm: áo thun, áo sơ mi, quần short, quần kaki. Giá từ 167.000 - 347.000 VND.'
        }),
      });

      const data = await response.json();
      return data.response || data.message;
    } catch (error) {
      console.error('Error calling AWS API:', error);
      // Fallback to local response if API fails
      return getLocalResponse(userMessage);
    }
  };

  // Hàm phản hồi local (cho demo khi chưa có AWS)
  const getLocalResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Tư vấn về sản phẩm
    if (lowerMessage.includes('áo thun') || lowerMessage.includes('ao thun')) {
      return 'Chúng tôi có nhiều loại áo thun chất lượng:\n\n' +
             '• Áo Thun The Trainer - Ultra Stretch, rất thoải mái cho hoạt động thể thao (297.000đ)\n' +
             '• Áo Thun Sweater The Minimalist - Mềm mịn, mát lạnh (327.000đ)\n' +
             '• Áo Thun Jersey No Style - Thoáng mát, giá tốt (227.000đ)\n\n' +
             'Bạn thích loại nào? Tôi có thể tư vấn thêm về size và màu sắc.';
    }
    
    if (lowerMessage.includes('quần') || lowerMessage.includes('quan')) {
      return 'Shop có các loại quần sau:\n\n' +
             '• Quần Short Thun 9 Inch - Thoáng mát, phù hợp mùa hè (167.000đ)\n' +
             '• Quần Short Kaki 7 Inch - Co giãn, phong cách lịch sự (261.000đ)\n\n' +
             'Bạn muốn tìm quần cho dịp nào? Đi chơi hay đi làm?';
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('số đo')) {
      return 'Về size, shop có bảng size chi tiết:\n\n' +
             '• Size S: 45-55kg, cao 1m55-1m65\n' +
             '• Size M: 55-65kg, cao 1m60-1m70\n' +
             '• Size L: 65-75kg, cao 1m65-1m75\n' +
             '• Size XL: 75-85kg, cao 1m70-1m80\n\n' +
             'Bạn cho tôi biết cân nặng và chiều cao để tôi tư vấn size phù hợp nhé!';
    }
    
    if (lowerMessage.includes('giá') || lowerMessage.includes('gia')) {
      return 'Giá sản phẩm của shop rất cạnh tranh:\n\n' +
             '💰 Từ 167.000đ - 200.000đ: Áo thun basic, quần short thun\n' +
             '💰 Từ 227.000đ - 297.000đ: Áo thun cao cấp, quần kaki\n' +
             '💰 Từ 327.000đ - 347.000đ: Áo sweater, áo sơ mi premium\n\n' +
             'Tất cả sản phẩm đều có chính sách bảo hành và đổi trả!';
    }
    
    if (lowerMessage.includes('màu') || lowerMessage.includes('mau')) {
      return 'Shop có đầy đủ các màu sắc cơ bản và thời trang:\n\n' +
             '⚫ Đen - Lịch sự, dễ phối đồ\n' +
             '⚪ Trắng - Tươi mới, thanh lịch\n' +
             '🔵 Xanh - Năng động, trẻ trung\n' +
             '🟤 Nâu/Be - Ấm áp, vintage\n\n' +
             'Bạn thích màu nào? Tôi có thể gợi ý sản phẩm phù hợp!';
    }
    
    if (lowerMessage.includes('giao hàng') || lowerMessage.includes('ship')) {
      return 'Về giao hàng:\n\n' +
             '🚚 Miễn phí ship đơn từ 300.000đ\n' +
             '⏰ Giao hàng trong 2-3 ngày\n' +
             '📦 Đóng gói cẩn thận\n' +
             '💯 Được kiểm tra hàng trước khi nhận\n\n' +
             'Bạn có thể xem thêm thông tin tại mục "Vận Chuyển" nhé!';
    }
    
    if (lowerMessage.includes('đổi') || lowerMessage.includes('trả') || lowerMessage.includes('doi') || lowerMessage.includes('tra')) {
      return 'Chính sách đổi trả của shop:\n\n' +
             '✅ Đổi size miễn phí trong 7 ngày\n' +
             '✅ Hoàn tiền 100% nếu lỗi nhà sản xuất\n' +
             '✅ Sản phẩm chưa qua sử dụng, còn nguyên tag\n\n' +
             'Bạn có thể xem chi tiết tại mục "Đổi Trả" hoặc liên hệ hotline để được hỗ trợ!';
    }
    
    // Default response
    return 'Cảm ơn bạn đã nhắn tin! Tôi có thể giúp bạn:\n\n' +
           '👕 Tư vấn sản phẩm (áo thun, áo sơ mi, quần...)\n' +
           '📏 Hướng dẫn chọn size\n' +
           '💰 Thông tin giá cả và khuyến mãi\n' +
           '🚚 Chính sách giao hàng và đổi trả\n' +
           '🎨 Tư vấn phối màu và phong cách\n\n' +
           'Bạn muốn hỏi về vấn đề gì?';
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate API call delay
    setTimeout(async () => {
      try {
        // Call AWS API or use local response
        const botResponse = await callAWSBedrockAPI(inputMessage);
        
        const botMessage = {
          id: messages.length + 2,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        const errorMessage = {
          id: messages.length + 2,
          text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chatbox-container">
      {/* Chat Button */}
      {!isOpen && (
        <button 
          className="chat-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className="chat-button-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <MessageCircle size={20} />
              </div>
              <div className="chat-header-text">
                <h3>Trợ Lý AI</h3>
                <span className="chat-status">
                  <span className="status-dot"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>
            <button 
              className="chat-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}
              >
                <div className="message-content">
                  <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message message-bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-container">
            <textarea
              className="chat-input"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
            />
            <button 
              className="chat-send-button"
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === ''}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>

          {/* Footer */}
          <div className="chat-footer">
            <span>Powered by AWS Bedrock AI</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;

