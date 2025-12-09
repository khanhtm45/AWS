"""
AWS Lambda Function for Chatbot using Bedrock
Deploy this function to AWS Lambda to handle chatbot requests
"""

import json
import boto3
import os
import re
import urllib3
from datetime import datetime

# Initialize Bedrock client
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)

# Model configuration
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')

# Backend API endpoint
BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'https://aws-e4h8.onrender.com')

# HTTP client
http = urllib3.PoolManager()

def detect_product_search_intent(user_message):
    """Phát hiện intent tìm kiếm sản phẩm từ câu hỏi"""
    search_keywords = [
        r'tìm\s+sản\s+phẩm',
        r'tìm\s+áo',
        r'tìm\s+quần',
        r'có\s+áo',
        r'có\s+quần',
        r'muốn\s+mua',
        r'muốn\s+xem',
        r'gợi\s+ý',
        r'giới\s+thiệu',
        r'tư\s+vấn',
        r'áo\s+thun',
        r'áo\s+sơ\s+mi',
        r'quần\s+jean',
        r'quần\s+kaki',
        r'quần\s+short',
        r'sweater',
        r'hoodie',
    ]
    
    message_lower = user_message.lower()
    for pattern in search_keywords:
        if re.search(pattern, message_lower):
            return True
    return False

def extract_search_query(user_message):
    """Trích xuất query để tìm kiếm sản phẩm - giữ nguyên style keywords"""
    # Loại bỏ các từ dừng không cần thiết NHƯNG GIỮ LẠI style keywords
    stop_words = ['tôi', 'muốn', 'mua', 'xem', 'có', 'không', 'bạn', 'giúp', 'tư vấn', 'giới thiệu', 'gợi ý', 'cho', 'của', 'với', 'và', 'hoặc']
    
    # Style keywords cần giữ lại
    style_keywords = [
        'trẻ trung', 'thanh lịch', 'thể thao', 'công sở', 'dạo phố',
        'minimalist', 'vintage', 'retro', 'casual', 'formal', 'sporty',
        'năng động', 'sang trọng', 'lịch sự', 'tươi mới', 'đơn giản'
    ]
    
    # Kiểm tra xem có style keyword 2 từ không (ví dụ: "trẻ trung")
    message_lower = user_message.lower()
    for style in style_keywords:
        if style in message_lower:
            # Giữ nguyên style keyword, chỉ loại bỏ stop words khác
            words = message_lower.split()
            query_words = []
            i = 0
            while i < len(words):
                word = words[i]
                # Check 2-word style
                if i < len(words) - 1:
                    two_word = word + ' ' + words[i + 1]
                    if two_word in style_keywords:
                        query_words.append(two_word)
                        i += 2
                        continue
                # Check single word
                if word not in stop_words and len(word) > 1:
                    query_words.append(word)
                i += 1
            return ' '.join(query_words)
    
    # Nếu không có style keyword đặc biệt, xử lý bình thường
    words = message_lower.split()
    query_words = [w for w in words if w not in stop_words and len(w) > 1]
    
    return ' '.join(query_words)

def fetch_product_suggestions(query, limit=5):
    """Gọi backend API để lấy gợi ý sản phẩm"""
    try:
        url = f"{BACKEND_API_URL}/api/public/chatbot/suggest-products"
        body = json.dumps({
            'query': query,
            'limit': limit
        })
        
        response = http.request(
            'POST',
            url,
            body=body,
            headers={'Content-Type': 'application/json'},
            timeout=5.0
        )
        
        if response.status == 200:
            data = json.loads(response.data.decode('utf-8'))
            return data
        else:
            print(f"Backend API error: {response.status}")
            return []
            
    except Exception as e:
        print(f"Error fetching product suggestions: {str(e)}")
        return []

def format_products_for_prompt(products):
    """Format danh sách sản phẩm thành text cho prompt"""
    if not products:
        return "Không tìm thấy sản phẩm phù hợp."
    
    formatted = "DANH SÁCH SẢN PHẨM LIÊN QUAN:\n\n"
    for idx, p in enumerate(products, 1):
        formatted += f"{idx}. {p['name']}\n"
        formatted += f"   - Giá: {int(p['price']):,}đ\n"
        if p.get('description'):
            # Giới hạn mô tả 100 ký tự
            desc = p['description'][:100] + '...' if len(p['description']) > 100 else p['description']
            formatted += f"   - Mô tả: {desc}\n"
        if p.get('colors'):
            formatted += f"   - Màu sắc: {', '.join(p['colors'])}\n"
        if p.get('sizes'):
            formatted += f"   - Size: {', '.join(p['sizes'])}\n"
        if p.get('isPreorder'):
            formatted += f"   - Đặt trước: {p['preorderDays']} ngày\n"
        formatted += f"   - ID: {p['productId']}\n\n"
    
    return formatted

def create_shop_prompt(user_message, context):
    """Tạo prompt tối ưu cho chatbot shop quần áo"""
    
    system_prompt = """Bạn là trợ lý AI thông minh của một shop quần áo thời trang tên "Fashion Shop".

THÔNG TIN SHOP:
- Sản phẩm: Áo thun, áo sơ mi, quần short, quần kaki cho nam và nữ
- Giá: 167.000đ - 347.000đ
- Size: S, M, L, XL
- Màu sắc: Đen, Trắng, Xanh, Nâu/Be
- Chính sách:
  + Miễn phí ship đơn từ 300.000đ
  + Giao hàng 2-3 ngày
  + Đổi size miễn phí trong 7 ngày
  + Hoàn tiền 100% nếu lỗi sản xuất

NHIỆM VỤ CỦA BẠN:
✅ Tư vấn sản phẩm phù hợp với nhu cầu khách hàng
✅ Hướng dẫn chọn size dựa trên cân nặng/chiều cao
✅ Tư vấn phối màu và phong cách
✅ Giải đáp về giá cả, khuyến mãi
✅ Hướng dẫn về giao hàng và đổi trả

CÁCH TRẢ LỜI:
- Nhiệt tình, thân thiện, chuyên nghiệp
- Ngắn gọn, dễ hiểu (80-150 từ)
- Dùng emoji phù hợp (👕 💰 🚚 ✅)
- Đề xuất sản phẩm cụ thể khi có thể
- Hỏi lại nếu cần thêm thông tin
- Khi có danh sách sản phẩm, tóm tắt và highlight 2-3 sản phẩm nổi bật nhất

VÍ DỤ TRẢ LỜI TỐT:
"Chào bạn! 👕 Với cân nặng 65kg và cao 1m70, mình khuyên bạn nên chọn size M cho áo thun. Size này sẽ vừa vặn và thoải mái.

Về màu sắc, nếu bạn thích phong cách lịch sự thì có thể chọn:
⚫ Đen - Dễ phối, sang trọng
⚪ Trắng - Tươi mới, thanh lịch

Bạn có muốn xem thêm về áo thun The Trainer (297.000đ) hay Sweater The Minimalist (327.000đ) không?"
"""
    
    # Kiểm tra xem có phải intent tìm kiếm sản phẩm không
    if detect_product_search_intent(user_message):
        search_query = extract_search_query(user_message)
        products = fetch_product_suggestions(search_query, limit=5)
        
        if products:
            products_info = format_products_for_prompt(products)
            system_prompt += f"\n\n{products_info}"
            system_prompt += "\n\nHÃY SỬ DỤNG THÔNG TIN SẢN PHẨM TRÊN để tư vấn cho khách hàng. Giới thiệu 2-3 sản phẩm nổi bật nhất phù hợp với nhu cầu."
    
    return system_prompt, user_message

def invoke_bedrock_claude(prompt, user_message, max_tokens=500):
    """Call Claude model via Bedrock"""
    try:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.9,
            "system": prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        }
        
        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body)
        )
        
        response_body = json.loads(response['body'].read())
        ai_message = response_body['content'][0]['text']
        
        return ai_message, None
        
    except Exception as e:
        print(f"Bedrock error: {str(e)}")
        return None, str(e)

def lambda_handler(event, context):
    """Main Lambda handler"""
    
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Handle OPTIONS request for CORS
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': ''
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '').strip()
        context_info = body.get('context', '')
        
        # Validate input
        if not user_message:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'success': False,
                    'error': 'Message is required'
                }, ensure_ascii=False)
            }
        
        if len(user_message) > 500:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'success': False,
                    'error': 'Message too long (max 500 characters)'
                }, ensure_ascii=False)
            }
        
        # Create prompt
        system_prompt, processed_message = create_shop_prompt(user_message, context_info)
        
        # Call Bedrock
        ai_response, error = invoke_bedrock_claude(system_prompt, processed_message)
        
        if error:
            raise Exception(f"Bedrock invocation failed: {error}")
        
        # Success response
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': True,
                'response': ai_response,
                'timestamp': datetime.utcnow().isoformat()
            }, ensure_ascii=False)
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': False,
                'error': 'Invalid JSON in request body'
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': False,
                'response': 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
                'error': str(e) if os.environ.get('DEBUG') else None
            }, ensure_ascii=False)
        }

def get_cors_headers():
    """Get CORS headers for API responses"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }

# For local testing
if __name__ == '__main__':
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'message': 'Tôi muốn mua áo thun, bạn tư vấn giúp tôi',
            'context': 'Shop quần áo thời trang'
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))


