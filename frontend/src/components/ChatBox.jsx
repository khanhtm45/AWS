import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import './ChatBox.css';

function ChatBox() {
  // Open chat by default so chat is always visible on the frontend
  const [isOpen, setIsOpen] = useState(true);

  // Persist chat messages to localStorage so users keep history across reloads.
  const STORAGE_KEY = 'leafshop_chat_messages_v1';

  const loadStoredMessages = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Convert timestamp strings back to Date objects where possible
        return parsed.map((m) => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : new Date() }));
      }
    } catch (e) {
      console.warn('Failed to load chat messages from localStorage', e);
    }

    return [
      {
        id: 1,
        text: 'Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn về size, màu sắc và chất liệu. Bạn cần tôi giúp gì?',
        sender: 'bot',
        timestamp: new Date()
      }
    ];
  };

  const [messages, setMessages] = useState(loadStoredMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      const toStore = messages.map(m => ({ ...m, timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString() }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to persist chat messages', e);
    }
  }, [messages]);

  // Hàm gọi AWS Bedrock API
  const callAWSBedrockAPI = async (userMessage, intent = '') => {
    try {
      // Resolve API endpoint:
      // - If REACT_APP_AWS_API_ENDPOINT is set and not the placeholder, use it.
      // - If running on localhost, default to backend at http://localhost:8080/api/chat
      // - Otherwise use relative `/api/chat` (for same-origin deployments).
      const envEndpoint = process.env.REACT_APP_AWS_API_ENDPOINT;
      let API_ENDPOINT = null;
      if (envEndpoint && envEndpoint !== 'YOUR_API_GATEWAY_URL') {
        API_ENDPOINT = envEndpoint;
      } else if (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        API_ENDPOINT = 'http://localhost:8080/api/chat';
      } else {
        API_ENDPOINT = '/api/chat';
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          intent: intent,
          // Thêm context về shop
          context: 'Shop quần áo thời trang nam nữ, các dòng sản phẩm: áo thun, áo sơ mi, quần short, quần kaki. Giá từ 167.000 - 347.000 VND.'
        }),
      });

      // If the API returned non-OK (403/401/500), handle gracefully and fallback for suggestion intent.
      if (!response.ok) {
        let errBody = null;
        try { errBody = await response.json(); } catch (e) { errBody = await response.text().catch(() => null); }
        console.warn('Chat API returned non-OK:', response.status, errBody);
        if (intent === 'suggest_outfit') {
          return generateLocalSuggestions(userMessage);
        }
        // For other intents, throw to trigger the catch -> fallback to local text
        throw new Error(`API ${response.status} ${JSON.stringify(errBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling AWS API:', error);
      // If user asked for outfit suggestions, return local structured suggestions
      if (intent === 'suggest_outfit') {
        return generateLocalSuggestions(userMessage);
      }
      // Fallback to plain text response if API fails
      return { type: 'text', text: getLocalResponse(userMessage) };
    }
  };

  // Generate local suggestion payload (used when backend/API is unavailable)
  const generateLocalSuggestions = (message) => {
    const suggestions = [];
    for (let i = 1; i <= 6; i++) {
      suggestions.push({
        id: `local-${i}`,
        name: `Gợi ý ${i} — Set cho buổi hẹn tối`,
        price: `${199 + i * 50}.000₫`,
        image: `https://via.placeholder.com/320x320.png?text=Set+${i}`,
        url: `#/product/${i}`,
      });
    }
    return { type: 'suggestions', text: 'Mình gợi ý một vài set đồ cho buổi hẹn tối:', suggestions };
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
        // Detect intent (simple keyword detection). For a robust solution,
        // perform intent recognition on backend or via a dedicated intent model.
        const textLower = inputMessage.toLowerCase();
        const intent = (textLower.includes('gợi ý') || textLower.includes('goi y') || textLower.includes('gợi ý đồ')) ? 'suggest_outfit' : '';

        // Call AWS API or use local response
        const botResponse = await callAWSBedrockAPI(inputMessage, intent);

        if (botResponse && botResponse.type === 'suggestions') {
          const botMessage = {
            id: messages.length + 2,
            type: 'suggestions',
            text: botResponse.text || '',
            suggestions: botResponse.suggestions || [],
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          // fallback to plain text — ensure we don't insert raw objects (which show as "[object Object]")
          let text;
          if (!botResponse) {
            text = '';
          } else if (typeof botResponse === 'string') {
            text = botResponse;
          } else if (typeof botResponse === 'object') {
            text = botResponse.text || botResponse.response || botResponse.message || JSON.stringify(botResponse, null, 2);
          } else {
            text = String(botResponse);
          }

          const botMessage = {
            id: messages.length + 2,
            text: text,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        }
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button 
                  className="chat-clear-button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.confirm('Xóa lịch sử trò chuyện?')) {
                      setMessages([{ id: Date.now(), text: 'Lịch sử đã được xóa.', sender: 'bot', timestamp: new Date() }]);
                      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
                    }
                  }}
                  title="Xóa lịch sử trò chuyện"
                >
                  Clear
                </button>
                <button 
                  className="chat-close-button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message) => {
              if (message.type === 'suggestions') {
                return (
                  <div key={message.id} className={`message message-bot`}>
                    <div className="message-content">
                      <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                      <div className="suggestions-grid">
                        {message.suggestions && message.suggestions.map((p, idx) => (
                          <div className="suggestion-card" key={p.id || idx}>
                            <img src={p.image} alt={p.name} className="suggestion-image" />
                            <div className="suggestion-body">
                              <div className="suggestion-name">{p.name}</div>
                              <div className="suggestion-price">{p.price}</div>
                              <a href={p.url} className="suggestion-link">Xem</a>
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={message.id} 
                  className={`message ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}
                >
                  <div className="message-content">
                    <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              );
            })}
            
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

