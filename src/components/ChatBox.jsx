<<<<<<< HEAD
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
=======
import { useState } from 'react';
import './ChatBox.css';

const conversations = [
  { id: 1, name: 'Nguyễn Văn A', message: 'Xin chào, tôi muốn hỏi về sản phẩm...', time: '13 phút', avatar: '👤' },
  { id: 2, name: 'Trần Thị B', message: 'Tôi cần hỗ trợ về đơn hàng...', time: '25 phút', avatar: '👤' },
  { id: 3, name: 'Lê Văn C', message: 'Sản phẩm này có màu khác không?', time: '1 giờ', avatar: '👤' },
  { id: 4, name: 'Phạm Thị D', message: 'Khi nào ship hàng ạ?', time: '2 giờ', avatar: '👤' },
  { id: 5, name: 'Hoàng Văn E', message: 'Cảm ơn shop nhiều!', time: '3 giờ', avatar: '👤' },
  { id: 6, name: 'Võ Thị F', message: 'Tôi muốn đổi trả sản phẩm', time: '4 giờ', avatar: '👤' },
  { id: 7, name: 'Đặng Văn G', message: 'Có khuyến mãi gì không shop?', time: '5 giờ', avatar: '👤' },
  { id: 8, name: 'Bùi Thị H', message: 'Sản phẩm rất chất lượng!', time: '6 giờ', avatar: '👤' },
];

const sampleMessages = [
  { id: 1, sender: 'other', text: 'Xin chào! Tôi muốn hỏi về sản phẩm này', time: '10:30', avatar: '👤' },
  { 
    id: 2, 
    sender: 'me', 
    type: 'card',
    cardData: {
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      title: 'Áo Thun Premium',
      subtitle: 'fashionstore.vn'
    },
    time: '10:32'
  },
  { id: 3, sender: 'me', text: 'Đây là sản phẩm bạn quan tâm. Có thể tư vấn thêm cho bạn không?', time: '10:32' },
  { id: 4, sender: 'other', text: 'Vâng, tôi muốn biết thêm về chất liệu và size', time: '10:35', avatar: '👤' },
  { id: 5, sender: 'me', text: 'Sản phẩm được làm từ cotton 100%, có đầy đủ size từ S đến XXL', time: '10:36' },
];

const quickReplies = ["Cảm ơn bạn", 'Được rồi!', 'Tôi sẽ tư vấn thêm'];

export function ChatBox() {
  const [selectedChat, setSelectedChat] = useState(conversations[0]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(sampleMessages);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'me',
        text: message,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      }]);
      setMessage('');
    }
>>>>>>> ef2661a9ce60e81175f2ee49430eda1a0a055eb9
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

<<<<<<< HEAD
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

=======
  const handleQuickReply = (reply) => {
    setMessages([...messages, {
      id: messages.length + 1,
      sender: 'me',
      text: reply,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    }]);
  };

  return (
    <div className="chat-container">
      {/* Sidebar - Conversations List */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Tin nhắn khách hàng</h2>
        </div>
        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedChat.id === conv.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(conv)}
            >
              <div className="conversation-avatar">{conv.avatar}</div>
              <div className="conversation-details">
                <div className="conversation-top">
                  <h4>{conv.name}</h4>
                  <span className="conversation-time">{conv.time}</span>
                </div>
                <p className="conversation-message">{conv.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Chat Header */}
        <div className="chat-header">
          <button className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3>{selectedChat.name}</h3>
          <div className="chat-header-actions">
            <button className="header-action-btn" title="Gọi điện">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="header-action-btn" title="Thêm tùy chọn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.sender === 'other' && (
                <div className="message-avatar">{msg.avatar}</div>
              )}
              <div className="message-content">
                {msg.type === 'card' ? (
                  <div className="message-card">
                    <img src={msg.cardData.image} alt={msg.cardData.title} />
                    <div className="card-info">
                      <h4>{msg.cardData.title}</h4>
                      <p>{msg.cardData.subtitle}</p>
                    </div>
                  </div>
                ) : (
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                )}
                <div className="message-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {/* Quick Replies */}
          <div className="quick-replies">
            {quickReplies.map((reply, index) => (
              <button key={index} className="quick-reply-btn" onClick={() => handleQuickReply(reply)}>
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="chat-input-container">
          <button className="input-action-btn" title="Đính kèm file">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <button className="input-action-btn" title="Emoji">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
            </svg>
          </button>
          <button className="input-action-btn" title="Gửi sản phẩm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="input-action-btn send-btn" onClick={handleSendMessage} title="Gửi tin nhắn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
>>>>>>> ef2661a9ce60e81175f2ee49430eda1a0a055eb9
