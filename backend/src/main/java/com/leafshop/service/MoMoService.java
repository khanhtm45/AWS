package com.leafshop.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MoMoService {

    @Value("${momo.partnerCode:MOMO}")
    private String partnerCode;

    @Value("${momo.accessKey:}")
    private String accessKey;

    @Value("${momo.secretKey:}")
    private String secretKey;

    @Value("${momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String momoEndpoint;

    @Value("${momo.returnUrl:http://localhost:3001/payment-return}")
    private String returnUrl;

    @Value("${momo.notifyUrl:http://localhost:8080/api/payments/momo/callback}")
    private String notifyUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Create MoMo payment request
     * @param amount Amount in VND
     * @param orderInfo Order description
     * @param orderId Unique order ID
     * @return Payment URL to redirect user or null if failed
     */
    public String createPaymentUrl(long amount, String orderInfo, String orderId) {
        try {
            String requestId = orderId + "_" + System.currentTimeMillis();
            String extraData = "";
            String orderType = "momo_wallet";
            String requestType = "captureWallet";

            // Build raw signature data
            String rawSignature = "accessKey=" + accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + notifyUrl +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + partnerCode +
                    "&redirectUrl=" + returnUrl +
                    "&requestId=" + requestId +
                    "&requestType=" + requestType;

            String signature = hmacSHA256(rawSignature, secretKey);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("partnerName", "LEAF Shop");
            requestBody.put("storeId", "LeafStore01");
            requestBody.put("requestId", requestId);
            requestBody.put("amount", amount);
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("redirectUrl", returnUrl);
            requestBody.put("ipnUrl", notifyUrl);
            requestBody.put("lang", "vi");
            requestBody.put("extraData", extraData);
            requestBody.put("requestType", requestType);
            requestBody.put("signature", signature);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            // Send HTTP request to MoMo
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(momoEndpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> responseData = objectMapper.readValue(response.body(), Map.class);
                Object payUrlObj = responseData.get("payUrl");
                if (payUrlObj != null) {
                    return payUrlObj.toString();
                }
            }

            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Verify MoMo callback signature
     * @param momoParams Parameters from MoMo callback
     * @return true if signature is valid
     */
    public boolean verifyCallback(Map<String, String> momoParams) {
        String signature = momoParams.get("signature");
        if (signature == null) return false;

        String rawSignature = "accessKey=" + momoParams.getOrDefault("accessKey", accessKey) +
                "&amount=" + momoParams.getOrDefault("amount", "") +
                "&extraData=" + momoParams.getOrDefault("extraData", "") +
                "&message=" + momoParams.getOrDefault("message", "") +
                "&orderId=" + momoParams.getOrDefault("orderId", "") +
                "&orderInfo=" + momoParams.getOrDefault("orderInfo", "") +
                "&orderType=" + momoParams.getOrDefault("orderType", "") +
                "&partnerCode=" + momoParams.getOrDefault("partnerCode", "") +
                "&payType=" + momoParams.getOrDefault("payType", "") +
                "&requestId=" + momoParams.getOrDefault("requestId", "") +
                "&responseTime=" + momoParams.getOrDefault("responseTime", "") +
                "&resultCode=" + momoParams.getOrDefault("resultCode", "") +
                "&transId=" + momoParams.getOrDefault("transId", "");

        String calculatedSignature = hmacSHA256(rawSignature, secretKey);
        return signature.equals(calculatedSignature);
    }

    /**
     * Parse MoMo result code to payment status
     * @param resultCode MoMo result code
     * @return Payment status
     */
    public String getPaymentStatus(String resultCode) {
        if ("0".equals(resultCode)) {
            return "PAID";
        } else {
            return "FAILED";
        }
    }

    /**
     * Query transaction status from MoMo
     * @param orderId Order ID to query
     * @param requestId Request ID from initial payment
     * @return Transaction status response
     */
    public Map<String, Object> queryTransaction(String orderId, String requestId) {
        try {
            String rawSignature = "accessKey=" + accessKey +
                    "&orderId=" + orderId +
                    "&partnerCode=" + partnerCode +
                    "&requestId=" + requestId;

            String signature = hmacSHA256(rawSignature, secretKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("requestId", requestId);
            requestBody.put("orderId", orderId);
            requestBody.put("lang", "vi");
            requestBody.put("signature", signature);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://test-payment.momo.vn/v2/gateway/api/query"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), Map.class);
            }

            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private String hmacSHA256(String data, String secret) {
        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac256.init(secretKey);
            byte[] result = hmac256.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : result) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
