package com.leafshop.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leafshop.dto.order.OrderResponse;
import com.leafshop.dto.product.ProductResponse;
import com.leafshop.model.dynamodb.ProductTable;
import com.leafshop.repository.ProductTableRepository;
import com.leafshop.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final OrderService orderService;
    private final ProductService productService;
    private final ProductTableRepository productTableRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${bedrock.modelId:anthropic.claude-3-sonnet-20240229-v1:0}")
    private String modelId;

    @Value("${bedrock.region:us-east-1}")
    private String bedrockRegion;

    @Value("${bedrock.mock:false}")
    private boolean mockMode;

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý ảo thông minh của Leaf Shop - cửa hàng thời trang trực tuyến.
            
            Nhiệm vụ của bạn:
            1. Tư vấn sản phẩm thời trang (áo, quần, váy, phụ kiện)
            2. Hỗ trợ khách hàng tra cứu đơn hàng
            3. Giải đáp thắc mắc về chính sách đổi trả, vận chuyển
            4. Gợi ý outfit phù hợp
            
            Phong cách giao tiếp:
            - Thân thiện, nhiệt tình
            - Trả lời ngắn gọn, súc tích
            - Dùng emoji phù hợp
            - Luôn hỏi thêm nếu khách cần hỗ trợ gì khác
            
            Thông tin shop:
            - Tên: Leaf Shop
            - Chuyên: Thời trang nữ, nam, unisex
            - Miễn phí ship đơn từ 500k
            - Đổi trả trong 7 ngày
            - Hotline: 0123 456 789
            - Email: support@leafshop.vn
            """;

    public String chat(String userMessage, String userId, String conversationHistory) {
        try {
            // Check if user is asking about order tracking
            if (isOrderTrackingQuery(userMessage)) {
                return handleOrderTracking(userMessage, userId);
            }

            // Check if user is asking about products
            if (isProductQuery(userMessage)) {
                return handleProductQuery(userMessage, conversationHistory);
            }

            // Call Claude 3 for general chat
            return invokeClaude3(userMessage, conversationHistory, null);

        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hotline: 0123 456 789 📞";
        }
    }

    private boolean isOrderTrackingQuery(String message) {
        String lower = message.toLowerCase();
        return lower.contains("đơn hàng") || lower.contains("don hang")
                || lower.contains("order") || lower.contains("theo dõi")
                || lower.contains("tra cứu") || lower.contains("kiểm tra đơn");
    }

    private boolean isProductQuery(String message) {
        String lower = message.toLowerCase();
        // Detect product-related keywords
        return lower.contains("áo") || lower.contains("quần") || lower.contains("váy")
                || lower.contains("đầm") || lower.contains("sơ mi") || lower.contains("thun")
                || lower.contains("jean") || lower.contains("kaki") || lower.contains("short")
                || lower.contains("sản phẩm") || lower.contains("san pham")
                || lower.contains("mua") || lower.contains("giá") || lower.contains("gia")
                || lower.contains("có") || lower.contains("bán") || lower.contains("tìm")
                || lower.contains("xem") || lower.contains("show") || lower.contains("list");
    }

    private String handleOrderTracking(String message, String userId) {
        if (userId == null || userId.isEmpty()) {
            return "Để tra cứu đơn hàng, bạn vui lòng đăng nhập nhé! 🔐\n\n"
                    + "Hoặc bạn có thể cung cấp mã đơn hàng để tôi tra cứu giúp bạn.";
        }

        try {
            List<OrderResponse> orders = orderService.getOrdersForUser(userId);

            if (orders.isEmpty()) {
                return "Hiện tại bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm của chúng tôi nhé! 🛍️";
            }

            StringBuilder response = new StringBuilder("📦 Đơn hàng của bạn:\n\n");
            int count = Math.min(orders.size(), 3); // Show max 3 recent orders

            for (int i = 0; i < count; i++) {
                OrderResponse order = orders.get(i);
                response.append(String.format("🔹 Đơn #%s\n", order.getOrderId().substring(0, 8).toUpperCase()));
                response.append(String.format("   Trạng thái: %s\n", getStatusEmoji(order.getOrderStatus())));
                response.append(String.format("   Tổng tiền: %,.0f đ\n", order.getTotalAmount()));
                response.append("\n");
            }

            if (orders.size() > 3) {
                response.append(String.format("...và %d đơn hàng khác\n\n", orders.size() - 3));
            }

            response.append("Bạn cần hỗ trợ gì thêm về đơn hàng không? 😊");
            return response.toString();

        } catch (Exception e) {
            return "Xin lỗi, tôi không thể tra cứu đơn hàng lúc này. Vui lòng thử lại sau! 🙏";
        }
    }

    private String getStatusEmoji(String status) {
        return switch (status) {
            case "PENDING" ->
                "⏳ Chờ xử lý";
            case "CONFIRMED" ->
                "✅ Đã xác nhận";
            case "PROCESSING" ->
                "📦 Đang xử lý";
            case "SHIPPED" ->
                "🚚 Đang giao hàng";
            case "DELIVERED" ->
                "✨ Đã giao hàng";
            case "CANCELLED" ->
                "❌ Đã hủy";
            default ->
                status;
        };
    }

    private String handleProductQuery(String userMessage, String conversationHistory) {
        try {
            // Get all active products from database
            List<ProductResponse> products = productService.listProducts(null, null, true);

            if (products.isEmpty()) {
                return "Hiện tại shop chưa có sản phẩm nào. Vui lòng quay lại sau nhé! 🙏";
            }

            // Build product context for Claude
            String productContext = buildProductContext(products);

            // Call Claude with product context
            return invokeClaude3(userMessage, conversationHistory, productContext);

        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, tôi không thể tìm sản phẩm lúc này. Vui lòng thử lại sau! 🙏";
        }
    }

    private String buildProductContext(List<ProductResponse> products) {
        StringBuilder context = new StringBuilder("\n\nDANH SÁCH SẢN PHẨM HIỆN CÓ:\n");

        for (ProductResponse product : products) {
            context.append(String.format("\n🛍️ %s", product.getName()));
            if (product.getDescription() != null && !product.getDescription().isEmpty()) {
                context.append(String.format("\n  📝 Mô tả: %s", product.getDescription()));
            }
            context.append(String.format("\n  💰 Giá: %,.0f đ", product.getPrice()));

            // Lấy thông tin variants (size, màu sắc)
            try {
                String pk = DynamoDBKeyUtil.productPk(product.getProductId());
                List<ProductTable> variants = productTableRepository.findVariantsByPk(pk);

                if (!variants.isEmpty()) {
                    // Lấy danh sách màu sắc
                    java.util.Set<String> colors = new java.util.HashSet<>();
                    // Lấy danh sách size
                    java.util.Set<String> sizes = new java.util.HashSet<>();

                    for (ProductTable variant : variants) {
                        if (variant.getColors() != null && !variant.getColors().isEmpty()) {
                            colors.addAll(variant.getColors());
                        }
                        if (variant.getSize() != null && !variant.getSize().isEmpty()) {
                            sizes.add(variant.getSize());
                        }
                    }

                    if (!colors.isEmpty()) {
                        context.append(String.format("\n  🎨 Màu sắc: %s", String.join(", ", colors)));
                    }
                    if (!sizes.isEmpty()) {
                        context.append(String.format("\n  📏 Size: %s", String.join(", ", sizes)));
                    }
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy variants
            }

            if (product.getQuantity() != null && product.getQuantity() > 0) {
                context.append(String.format("\n  ✅ Còn hàng: %d sản phẩm", product.getQuantity()));
            } else {
                context.append("\n  ❌ Tình trạng: Hết hàng");
            }
            if (product.getIsPreorder() != null && product.getIsPreorder()) {
                context.append(String.format("\n  ⏰ Preorder: %d ngày", product.getPreorderDays()));
            }
            if (product.getTags() != null && !product.getTags().isEmpty()) {
                context.append(String.format("\n  🏷️ Tags: %s", String.join(", ", product.getTags())));
            }
            context.append("\n");
        }

        context.append("\n💡 HÃY SỬ DỤNG THÔNG TIN TRÊN ĐỂ TƯ VẤN CHO KHÁCH HÀNG VỀ SẢN PHẨM, SIZE, MÀU SẮC.");
        return context.toString();
    }

    private String invokeClaude3(String userMessage, String conversationHistory, String additionalContext) {
        if (mockMode) {
            return "🤖 [Mock Mode] Xin chào! Tôi là trợ lý AI của Leaf Shop. Bạn cần tôi hỗ trợ gì về thời trang không? 👗";
        }

        BedrockRuntimeClient client = null;
        try {
            client = BedrockRuntimeClient.builder()
                    .region(Region.of(bedrockRegion))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();

            // Build system prompt with additional context if provided
            String systemPrompt = SYSTEM_PROMPT;
            if (additionalContext != null && !additionalContext.isEmpty()) {
                systemPrompt = SYSTEM_PROMPT + additionalContext;
            }

            // Build messages for Claude 3
            String messages = buildClaudeMessages(userMessage, conversationHistory);

            // Create request payload for Claude 3
            Map<String, Object> payload = new HashMap<>();
            payload.put("anthropic_version", "bedrock-2023-05-31");
            payload.put("max_tokens", 1000);
            payload.put("temperature", 0.7);
            payload.put("system", systemPrompt);
            payload.put("messages", objectMapper.readValue(messages, List.class));

            String payloadJson = objectMapper.writeValueAsString(payload);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(modelId)
                    .body(SdkBytes.fromUtf8String(payloadJson))
                    .build();

            InvokeModelResponse response = client.invokeModel(request);
            String responseBody = response.body().asUtf8String();

            // Parse Claude 3 response
            JsonNode jsonResponse = objectMapper.readTree(responseBody);
            JsonNode content = jsonResponse.get("content");

            if (content != null && content.isArray() && content.size() > 0) {
                return content.get(0).get("text").asText();
            }

            return "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng thử lại! 🙏";

        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng liên hệ hotline: 0123 456 789 📞";
        } finally {
            if (client != null) {
                client.close();
            }
        }
    }

    private String buildClaudeMessages(String userMessage, String conversationHistory) {
        try {
            // Simple format: just the current user message
            // You can extend this to include conversation history
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", userMessage);

            return objectMapper.writeValueAsString(List.of(message));
        } catch (Exception e) {
            return "[{\"role\":\"user\",\"content\":\"" + userMessage.replace("\"", "\\\"") + "\"}]";
        }
    }
}
