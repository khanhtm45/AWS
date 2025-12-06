package com.leafshop.service;

import com.leafshop.dto.order.OrderItemResponse;
import com.leafshop.dto.order.OrderResponse;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@Service
public class InvoiceService {

    @Autowired
    private EmailService emailService;

    private static final Font FONT_TITLE = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, BaseColor.BLACK);
    private static final Font FONT_HEADER = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, BaseColor.BLACK);
    private static final Font FONT_NORMAL = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, BaseColor.BLACK);
    private static final Font FONT_BOLD = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.BLACK);
    private static final Font FONT_SMALL = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.GRAY);

    private static final NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
    private static final SimpleDateFormat dateFormatter = new SimpleDateFormat("dd/MM/yyyy HH:mm");

    /**
     * Generate invoice PDF
     */
    public byte[] generateInvoicePDF(OrderResponse order) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(document, baos);

        document.open();

        // Header
        addHeader(document, order);
        document.add(new Paragraph(" "));

        // Customer Info
        addCustomerInfo(document, order);
        document.add(new Paragraph(" "));

        // Order Items Table
        addOrderItemsTable(document, order);
        document.add(new Paragraph(" "));

        // Totals
        addTotals(document, order);
        document.add(new Paragraph(" "));

        // Payment Info
        addPaymentInfo(document, order);
        document.add(new Paragraph(" "));

        // Footer
        addFooter(document);

        document.close();

        return baos.toByteArray();
    }

    private void addHeader(Document document, OrderResponse order) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(20);

        // Company info
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        Paragraph companyInfo = new Paragraph();
        companyInfo.add(new Chunk("LEAF SHOP\n", FONT_TITLE));
        companyInfo.add(new Chunk("123 Duong ABC, Quan XYZ, TP.HCM\n", FONT_SMALL));
        companyInfo.add(new Chunk("Dien thoai: 0123 456 789\n", FONT_SMALL));
        companyInfo.add(new Chunk("Email: support@leafshop.vn", FONT_SMALL));
        companyCell.addElement(companyInfo);
        headerTable.addCell(companyCell);

        // Invoice details
        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBorder(Rectangle.NO_BORDER);
        invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph invoiceInfo = new Paragraph();
        invoiceInfo.add(new Chunk("HOA DON\n", FONT_HEADER));
        invoiceInfo.add(new Chunk("So: " + order.getOrderId().substring(0, 8).toUpperCase() + "\n", FONT_NORMAL));
        String dateStr = order.getCreatedAt() != null ? dateFormatter.format(new Date(order.getCreatedAt())) : "N/A";
        invoiceInfo.add(new Chunk("Ngay: " + dateStr + "\n", FONT_NORMAL));
        invoiceInfo.add(new Chunk("Trang thai: " + getStatusText(order.getOrderStatus()), FONT_NORMAL));
        invoiceCell.addElement(invoiceInfo);
        headerTable.addCell(invoiceCell);

        document.add(headerTable);

        // Add horizontal line
        LineSeparator line = new LineSeparator(1, 100, BaseColor.GRAY, Element.ALIGN_CENTER, -2);
        document.add(new Chunk(line));
    }

    private void addCustomerInfo(Document document, OrderResponse order) throws DocumentException {
        Paragraph title = new Paragraph("Thong tin khach hang", FONT_HEADER);
        title.setSpacingAfter(10);
        document.add(title);

        PdfPTable customerTable = new PdfPTable(2);
        customerTable.setWidthPercentage(100);
        customerTable.setWidths(new int[]{1, 3});

        addCustomerRow(customerTable, "Ho ten:", order.getShippingAddress() != null ? order.getShippingAddress().getFullName() : "N/A");
        addCustomerRow(customerTable, "So dien thoai:", order.getShippingAddress() != null ? order.getShippingAddress().getPhoneNumber() : "N/A");
        addCustomerRow(customerTable, "Email:", order.getUserId());

        String address = "";
        if (order.getShippingAddress() != null) {
            address = String.format("%s, %s, %s, %s, %s",
                    order.getShippingAddress().getAddressLine1() != null ? order.getShippingAddress().getAddressLine1() : "",
                    order.getShippingAddress().getWard() != null ? order.getShippingAddress().getWard() : "",
                    order.getShippingAddress().getDistrict() != null ? order.getShippingAddress().getDistrict() : "",
                    order.getShippingAddress().getCity() != null ? order.getShippingAddress().getCity() : "",
                    order.getShippingAddress().getCountry() != null ? order.getShippingAddress().getCountry() : "");
        }
        addCustomerRow(customerTable, "Dia chi giao hang:", address);

        document.add(customerTable);
    }

    private void addCustomerRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, FONT_BOLD));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, FONT_NORMAL));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }

    private void addOrderItemsTable(Document document, OrderResponse order) throws DocumentException {
        Paragraph title = new Paragraph("Chi tiet don hang", FONT_HEADER);
        title.setSpacingAfter(10);
        document.add(title);

        PdfPTable itemsTable = new PdfPTable(5);
        itemsTable.setWidthPercentage(100);
        itemsTable.setWidths(new int[]{1, 4, 2, 3, 3});

        // Header
        BaseColor headerColor = new BaseColor(45, 80, 22);
        addTableHeader(itemsTable, "STT", headerColor);
        addTableHeader(itemsTable, "San pham", headerColor);
        addTableHeader(itemsTable, "So luong", headerColor);
        addTableHeader(itemsTable, "Don gia", headerColor);
        addTableHeader(itemsTable, "Thanh tien", headerColor);

        // Items
        int index = 1;
        for (OrderItemResponse item : order.getItems()) {
            addTableCell(itemsTable, String.valueOf(index++), Element.ALIGN_CENTER);
            addTableCell(itemsTable, item.getProductName() != null ? item.getProductName() : item.getProductId(), Element.ALIGN_LEFT);
            addTableCell(itemsTable, String.valueOf(item.getQuantity()), Element.ALIGN_CENTER);
            addTableCell(itemsTable, currencyFormatter.format(item.getUnitPrice()), Element.ALIGN_RIGHT);
            addTableCell(itemsTable, currencyFormatter.format(item.getItemTotal()), Element.ALIGN_RIGHT);
        }

        document.add(itemsTable);
    }

    private void addTableHeader(PdfPTable table, String text, BaseColor color) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
        cell.setBackgroundColor(color);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_NORMAL));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private void addTotals(Document document, OrderResponse order) throws DocumentException {
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(50);
        totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalsTable.setWidths(new int[]{2, 2});

        addTotalRow(totalsTable, "Tam tinh:", currencyFormatter.format(order.getSubtotal()), false);
        addTotalRow(totalsTable, "Phi van chuyen:", currencyFormatter.format(order.getShippingAmount()), false);
        if (order.getDiscountAmount() > 0) {
            addTotalRow(totalsTable, "Giam gia:", "-" + currencyFormatter.format(order.getDiscountAmount()), false);
        }
        addTotalRow(totalsTable, "TONG CONG:", currencyFormatter.format(order.getTotalAmount()), true);

        document.add(totalsTable);
    }

    private void addTotalRow(PdfPTable table, String label, String value, boolean isGrandTotal) {
        Font font = isGrandTotal ? new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, BaseColor.BLACK) : FONT_NORMAL;
        
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(isGrandTotal ? Rectangle.TOP : Rectangle.NO_BORDER);
        labelCell.setPadding(8);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(isGrandTotal ? Rectangle.TOP : Rectangle.NO_BORDER);
        valueCell.setPadding(8);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private void addPaymentInfo(Document document, OrderResponse order) throws DocumentException {
        Paragraph title = new Paragraph("Thong tin thanh toan", FONT_HEADER);
        title.setSpacingAfter(10);
        document.add(title);

        PdfPTable paymentTable = new PdfPTable(2);
        paymentTable.setWidthPercentage(100);
        paymentTable.setWidths(new int[]{1, 3});

        addCustomerRow(paymentTable, "Phuong thuc thanh toan:", getPaymentMethodText(order.getPaymentMethod()));
        addCustomerRow(paymentTable, "Trang thai thanh toan:", order.getPaymentStatus().equals("PAID") ? "Da thanh toan" : "Chua thanh toan");

        document.add(paymentTable);
    }

    private void addFooter(Document document) throws DocumentException {
        LineSeparator line = new LineSeparator(1, 100, BaseColor.GRAY, Element.ALIGN_CENTER, -2);
        document.add(new Chunk(line));

        Paragraph footer = new Paragraph();
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(20);
        footer.add(new Chunk("Cam on quy khach da mua hang tai Leaf Shop!\n", FONT_BOLD));
        footer.add(new Chunk("Moi thac mac vui long lien he: support@leafshop.vn hoac 0123 456 789", FONT_SMALL));

        document.add(footer);
    }

    private String getStatusText(String status) {
        switch (status) {
            case "PENDING": return "Cho xu ly";
            case "CONFIRMED": return "Da xac nhan";
            case "PROCESSING": return "Dang xu ly";
            case "SHIPPED": return "Dang giao hang";
            case "DELIVERED": return "Da giao hang";
            case "CANCELLED": return "Da huy";
            default: return status;
        }
    }

    private String getPaymentMethodText(String method) {
        switch (method.toLowerCase()) {
            case "cod": return "Thanh toan khi nhan hang";
            case "bank_transfer": return "Chuyen khoan ngan hang";
            case "credit_card": return "The tin dung";
            case "vnpay": return "VNPay";
            case "momo": return "MoMo";
            default: return method;
        }
    }

    /**
     * Send invoice via email
     */
    public boolean sendInvoiceEmail(OrderResponse order, String email) {
        try {
            // Generate PDF
            byte[] pdfBytes = generateInvoicePDF(order);

            // Send email with PDF attachment
            String subject = "Hoa don don hang #" + order.getOrderId().substring(0, 8).toUpperCase();
            String body = buildEmailBody(order);

            return emailService.sendEmailWithAttachment(email, subject, body, pdfBytes, "HoaDon_" + order.getOrderId() + ".pdf");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private String buildEmailBody(OrderResponse order) {
        StringBuilder body = new StringBuilder();
        body.append("<html><body style='font-family: Arial, sans-serif;'>");
        body.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");
        body.append("<h2 style='color: #2d5016;'>Cam on quy khach da dat hang!</h2>");
        body.append("<p>Xin chao <strong>").append(order.getShippingAddress() != null ? order.getShippingAddress().getFullName() : "").append("</strong>,</p>");
        body.append("<p>Chung toi da gui kem hoa don cho don hang #").append(order.getOrderId().substring(0, 8).toUpperCase()).append(".</p>");
        body.append("<p><strong>Tong tien:</strong> ").append(currencyFormatter.format(order.getTotalAmount())).append("</p>");
        body.append("<p><strong>Trang thai:</strong> ").append(getStatusText(order.getOrderStatus())).append("</p>");
        body.append("<hr style='border: 1px solid #e0e0e0; margin: 20px 0;'>");
        body.append("<p style='color: #666; font-size: 14px;'>Neu co bat ky thac mac nao, vui long lien he:</p>");
        body.append("<p style='color: #666; font-size: 14px;'>Email: support@leafshop.vn<br>Dien thoai: 0123 456 789</p>");
        body.append("<p style='margin-top: 30px;'>Tran trong,<br><strong style='color: #2d5016;'>Leaf Shop Team</strong></p>");
        body.append("</div></body></html>");
        return body.toString();
    }
}
