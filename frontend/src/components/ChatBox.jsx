import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import './ChatBox.css';

function ChatBox() {
  // Load chat open state from localStorage, default to false (closed)
  const loadChatOpenState = () => {
    try {
      const saved = localStorage.getItem('leafshop_chat_open');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  };

  const [isOpen, setIsOpen] = useState(loadChatOpenState);

  // Save chat open state to localStorage
  const updateChatOpenState = (newState) => {
    try {
      localStorage.setItem('leafshop_chat_open', JSON.stringify(newState));
      setIsOpen(newState);
    } catch (e) {
      console.warn('Failed to save chat open state:', e);
      setIsOpen(newState);
    }
  };

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
        text: 'Xin chào! Tôi là tr? lý AI c?a shop. Tôi có th? giúp b?n tìm ki?m s?n ph?m, tu v?n v? size, màu s?c và ch?t li?u. B?n c?n tôi giúp gì?',
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

  // Hàm g?i backend d? g?i ý s?n ph?m
  const fetchProductSuggestions = async (query) => {
    try {
      const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '${API_BASE_URL}'
        : '';
      
      const response = await fetch(`${backendUrl}/api/public/chatbot/suggest-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          limit: 5
        }),
      });

      if (response.ok) {
        const products = await response.json();
        return products;
      }
      return [];
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      return [];
    }
  };

  // Hàm g?i AWS Bedrock API
  const callAWSBedrockAPI = async (userMessage, intent = '') => {
    try {
      // Resolve API endpoint:
      // - If REACT_APP_AWS_API_ENDPOINT is set and not the placeholder, use it.
      // - If running on localhost, default to backend at ${API_BASE_URL}/api/chat
      // - Otherwise use relative `/api/chat` (for same-origin deployments).
      const envEndpoint = process.env.REACT_APP_AWS_API_ENDPOINT;
      let API_ENDPOINT = null;
      if (envEndpoint && envEndpoint !== 'YOUR_API_GATEWAY_URL') {
        API_ENDPOINT = envEndpoint;
      } else if (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        API_ENDPOINT = '${API_BASE_URL}/api/chat';
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
          // Thêm context v? shop
          context: 'Shop qu?n áo th?i trang nam n?, các dòng s?n ph?m: áo thun, áo so mi, qu?n short, qu?n kaki. Giá t? 167.000 - 347.000 VND.'
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
        name: `G?i ý ${i} — Set cho bu?i h?n t?i`,
        price: `${199 + i * 50}.000?`,
        image: `https://via.placeholder.com/320x320.png?text=Set+${i}`,
        url: `#/product/${i}`,
      });
    }
    return { type: 'suggestions', text: 'Mình g?i ý m?t vài set d? cho bu?i h?n t?i:', suggestions };
  };

  // Hàm ph?n h?i local (cho demo khi chua có AWS)
  const getLocalResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Tu v?n v? s?n ph?m
    if (lowerMessage.includes('áo thun') || lowerMessage.includes('ao thun')) {
      return 'Chúng tôi có nhi?u lo?i áo thun ch?t lu?ng:\n\n' +
             '• Áo Thun The Trainer - Ultra Stretch, r?t tho?i mái cho ho?t d?ng th? thao (297.000d)\n' +
             '• Áo Thun Sweater The Minimalist - M?m m?n, mát l?nh (327.000d)\n' +
             '• Áo Thun Jersey No Style - Thoáng mát, giá t?t (227.000d)\n\n' +
             'B?n thích lo?i nào? Tôi có th? tu v?n thêm v? size và màu s?c.';
    }
    
    if (lowerMessage.includes('qu?n') || lowerMessage.includes('quan')) {
      return 'Shop có các lo?i qu?n sau:\n\n' +
             '• Qu?n Short Thun 9 Inch - Thoáng mát, phù h?p mùa hè (167.000d)\n' +
             '• Qu?n Short Kaki 7 Inch - Co giãn, phong cách l?ch s? (261.000d)\n\n' +
             'B?n mu?n tìm qu?n cho d?p nào? Ði choi hay di làm?';
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('s? do')) {
      return 'V? size, shop có b?ng size chi ti?t:\n\n' +
             '• Size S: 45-55kg, cao 1m55-1m65\n' +
             '• Size M: 55-65kg, cao 1m60-1m70\n' +
             '• Size L: 65-75kg, cao 1m65-1m75\n' +
             '• Size XL: 75-85kg, cao 1m70-1m80\n\n' +
             'B?n cho tôi bi?t cân n?ng và chi?u cao d? tôi tu v?n size phù h?p nhé!';
    }
    
    if (lowerMessage.includes('giá') || lowerMessage.includes('gia')) {
      return 'Giá s?n ph?m c?a shop r?t c?nh tranh:\n\n' +
             '?? T? 167.000d - 200.000d: Áo thun basic, qu?n short thun\n' +
             '?? T? 227.000d - 297.000d: Áo thun cao c?p, qu?n kaki\n' +
             '?? T? 327.000d - 347.000d: Áo sweater, áo so mi premium\n\n' +
             'T?t c? s?n ph?m d?u có chính sách b?o hành và d?i tr?!';
    }
    
    if (lowerMessage.includes('màu') || lowerMessage.includes('mau')) {
      return 'Shop có d?y d? các màu s?c co b?n và th?i trang:\n\n' +
             '? Ðen - L?ch s?, d? ph?i d?\n' +
             '? Tr?ng - Tuoi m?i, thanh l?ch\n' +
             '?? Xanh - Nang d?ng, tr? trung\n' +
             '?? Nâu/Be - ?m áp, vintage\n\n' +
             'B?n thích màu nào? Tôi có th? g?i ý s?n ph?m phù h?p!';
    }
    
    if (lowerMessage.includes('giao hàng') || lowerMessage.includes('ship')) {
      return 'V? giao hàng:\n\n' +
             '?? Mi?n phí ship don t? 300.000d\n' +
             '? Giao hàng trong 2-3 ngày\n' +
             '?? Ðóng gói c?n th?n\n' +
             '?? Ðu?c ki?m tra hàng tru?c khi nh?n\n\n' +
             'B?n có th? xem thêm thông tin t?i m?c "V?n Chuy?n" nhé!';
    }
    
    if (lowerMessage.includes('d?i') || lowerMessage.includes('tr?') || lowerMessage.includes('doi') || lowerMessage.includes('tra')) {
      return 'Chính sách d?i tr? c?a shop:\n\n' +
             '? Ð?i size mi?n phí trong 7 ngày\n' +
             '? Hoàn ti?n 100% n?u l?i nhà s?n xu?t\n' +
             '? S?n ph?m chua qua s? d?ng, còn nguyên tag\n\n' +
             'B?n có th? xem chi ti?t t?i m?c "Ð?i Tr?" ho?c liên h? hotline d? du?c h? tr?!';
    }
    
    // Default response
    return 'C?m on b?n dã nh?n tin! Tôi có th? giúp b?n:\n\n' +
           '?? Tu v?n s?n ph?m (áo thun, áo so mi, qu?n...)\n' +
           '?? Hu?ng d?n ch?n size\n' +
           '?? Thông tin giá c? và khuy?n mãi\n' +
           '?? Chính sách giao hàng và d?i tr?\n' +
           '?? Tu v?n ph?i màu và phong cách\n\n' +
           'B?n mu?n h?i v? v?n d? gì?';
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
        // Detect intent (simple keyword detection)
        const textLower = inputMessage.toLowerCase();
        
        // Detect product search intent
        const productSearchKeywords = [
          'tìm', 'tìm ki?m', 'có', 'mu?n', 'c?n', 'g?i ý', 'goi y', 
          'áo', 'qu?n', 'quan', 'sweater', 'hoodie',
          'tr? trung', 'tre trung', 'thanh l?ch', 'thanh lich', 'th? thao', 'the thao',
          'cá tính', 'ca tinh', 'công s?', 'cong so', 'd?o ph?', 'dao pho',
          'minimalist', 'vintage', 'casual', 'formal'
        ];
        
        const isProductSearch = productSearchKeywords.some(keyword => textLower.includes(keyword));
        
        let botResponse;
        
        if (isProductSearch) {
          // G?i API backend d? tìm s?n ph?m
          const products = await fetchProductSuggestions(inputMessage);
          
          if (products && products.length > 0) {
            // Format products thành suggestions
            const suggestions = products.map(p => ({
              id: p.productId,
              name: p.name,
              price: `${parseInt(p.price).toLocaleString('vi-VN')}d`,
              image: p.primaryImageUrl || 'https://via.placeholder.com/320x320.png?text=No+Image',
              url: `/product/${p.productId}`,
              description: p.description,
              colors: p.colors,
              sizes: p.sizes
            }));
            
            botResponse = {
              type: 'suggestions',
              text: `Mình tìm du?c ${products.length} s?n ph?m phù h?p v?i b?n:`,
              suggestions: suggestions
            };
          } else {
            // Không tìm th?y s?n ph?m, fallback to AWS API
            const intent = (textLower.includes('g?i ý') || textLower.includes('goi y')) ? 'suggest_outfit' : '';
            botResponse = await callAWSBedrockAPI(inputMessage, intent);
          }
        } else {
          // Không ph?i tìm s?n ph?m, g?i AWS API bình thu?ng
          const intent = (textLower.includes('g?i ý') || textLower.includes('goi y') || textLower.includes('g?i ý d?')) ? 'suggest_outfit' : '';
          botResponse = await callAWSBedrockAPI(inputMessage, intent);
        }

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
          text: 'Xin l?i, tôi dang g?p s? c?. Vui lòng th? l?i sau.',
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
          onClick={() => updateChatOpenState(true)}
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
                <h3>Tr? Lý AI</h3>
                <span className="chat-status">
                  <span className="status-dot"></span>
                  Ðang ho?t d?ng
                </span>
              </div>
            </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button 
                  className="chat-clear-button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.confirm('Xóa l?ch s? trò chuy?n?')) {
                      setMessages([{ id: Date.now(), text: 'L?ch s? dã du?c xóa.', sender: 'bot', timestamp: new Date() }]);
                      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
                    }
                  }}
                  title="Xóa l?ch s? trò chuy?n"
                >
                  Clear
                </button>
                <button 
                  className="chat-close-button"
                  onClick={() => updateChatOpenState(false)}
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
                          <div 
                            className="suggestion-card" 
                            key={p.id || idx}
                            onClick={() => window.location.href = p.url}
                          >
                            <img src={p.image} alt={p.name} className="suggestion-image" />
                            <div className="suggestion-body">
                              <div className="suggestion-name">{p.name}</div>
                              <div className="suggestion-price">{p.price}</div>
                              {p.description && (
                                <div className="suggestion-description">{p.description}</div>
                              )}
                              {(p.colors || p.sizes) && (
                                <div className="suggestion-meta">
                                  {p.colors && p.colors.length > 0 && (
                                    <span className="suggestion-badge">
                                      Màu: {p.colors.slice(0, 2).join(', ')}
                                      {p.colors.length > 2 && '...'}
                                    </span>
                                  )}
                                  {p.sizes && p.sizes.length > 0 && (
                                    <span className="suggestion-badge">
                                      Size: {p.sizes.slice(0, 3).join(', ')}
                                    </span>
                                  )}
                                </div>
                              )}
                              <a 
                                href={p.url} 
                                className="suggestion-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Xem chi ti?t
                              </a>
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
              placeholder="Nh?p tin nh?n..."
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

