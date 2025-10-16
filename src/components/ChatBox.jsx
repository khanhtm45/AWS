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
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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