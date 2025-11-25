"""
AWS Lambda Function for Chatbot using Bedrock
Deploy this function to AWS Lambda to handle chatbot requests
"""

import json
import boto3
import os
from datetime import datetime

# Initialize Bedrock client
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)

# Model configuration
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')

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

VÍ DỤ TRẢ LỜI TỐT:
"Chào bạn! 👕 Với cân nặng 65kg và cao 1m70, mình khuyên bạn nên chọn size M cho áo thun. Size này sẽ vừa vặn và thoải mái.

Về màu sắc, nếu bạn thích phong cách lịch sự thì có thể chọn:
⚫ Đen - Dễ phối, sang trọng
⚪ Trắng - Tươi mới, thanh lịch

Bạn có muốn xem thêm về áo thun The Trainer (297.000đ) hay Sweater The Minimalist (327.000đ) không?"
"""
    
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


