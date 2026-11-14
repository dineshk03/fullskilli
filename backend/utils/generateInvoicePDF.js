/**
 * Generate Invoice HTML for PDF/Email attachment
 * This creates a standalone invoice that can be attached to emails
 */

exports.generateInvoiceHTML = (order, user, course) => {
    const invoiceNumber = order.invoiceNumber || `INV-${order._id.toString().slice(-8).toUpperCase()}`;
    const purchaseDate = new Date(order.purchaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
    const userEmail = user.email || 'N/A';
    const userPhone = user.additionalDetails?.contactNumber || 'N/A';
    const courseName = course.courseName || 'N/A';
    const instructorName = course.instructor?.firstName || 'Beeja';
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${invoiceNumber}</title>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        
        body {
            background: #f5f5f5;
            padding: 20px;
            color: #1f2937;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            padding: 40px;
            color: white;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        
        .company-info h1 {
            font-size: 32px;
            margin-bottom: 5px;
            color: #ffd60a;
        }
        
        .company-info p {
            font-size: 14px;
            color: #d1d5db;
        }
        
        .invoice-title {
            text-align: right;
        }
        
        .invoice-title h2 {
            font-size: 36px;
            margin-bottom: 10px;
            color: #ffd60a;
        }
        
        .invoice-number {
            background: #ffd60a;
            color: #000;
            padding: 8px 16px;
            border-radius: 5px;
            font-weight: 700;
            font-size: 16px;
            display: inline-block;
        }
        
        .header-divider {
            height: 3px;
            background: linear-gradient(90deg, #ffd60a 0%, #ffc300 100%);
            margin: 20px 0;
        }
        
        .invoice-body {
            padding: 40px;
        }
        
        .parties-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .party-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ffd60a;
        }
        
        .party-box h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 15px;
            letter-spacing: 0.5px;
        }
        
        .party-box p {
            margin: 8px 0;
            font-size: 14px;
            color: #374151;
        }
        
        .party-box .name {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .invoice-details {
            background: #eff6ff;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #dbeafe;
        }
        
        .invoice-details h3 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #1f2937;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: white;
            border-radius: 5px;
        }
        
        .detail-label {
            font-size: 13px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .detail-value {
            font-size: 13px;
            color: #1f2937;
            font-weight: 600;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        
        .items-table thead {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
        }
        
        .items-table th {
            padding: 15px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        
        .items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table td {
            padding: 20px 15px;
            font-size: 14px;
        }
        
        .item-description {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .item-details {
            font-size: 12px;
            color: #6b7280;
        }
        
        .totals-section {
            background: #f9fafb;
            padding: 25px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 15px;
        }
        
        .total-row.subtotal {
            border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row.discount {
            color: #10b981;
            font-weight: 600;
        }
        
        .total-row.grand-total {
            border-top: 2px solid #1f2937;
            padding-top: 15px;
            margin-top: 10px;
            font-size: 20px;
            font-weight: 700;
        }
        
        .total-row.grand-total .amount {
            color: #ffd60a;
        }
        
        .payment-info {
            background: #f0fdf4;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #10b981;
        }
        
        .payment-info h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #1f2937;
        }
        
        .payment-status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 6px 12px;
            border-radius: 5px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .invoice-footer {
            background: #f9fafb;
            padding: 30px 40px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
        }
        
        .invoice-footer h3 {
            font-size: 18px;
            margin-bottom: 10px;
            color: #1f2937;
        }
        
        .invoice-footer p {
            font-size: 14px;
            color: #6b7280;
            margin: 8px 0;
        }
        
        .invoice-footer .contact-info {
            margin-top: 20px;
            font-size: 13px;
        }
        
        .invoice-footer .note {
            margin-top: 20px;
            font-size: 12px;
            color: #9ca3af;
            font-style: italic;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="header-top">
                <div class="company-info">
                    <h1>🎓 Beeja Academy</h1>
                    <p>Excellence in Education</p>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <span class="invoice-number">${invoiceNumber}</span>
                </div>
            </div>
            <div class="header-divider"></div>
        </div>
        
        <!-- Body -->
        <div class="invoice-body">
            <!-- Parties Section -->
            <div class="parties-section">
                <div class="party-box">
                    <h3>Bill From</h3>
                    <p class="name">Beeja Academy</p>
                    <p>Excellence in Education</p>
                    <p>📞 +91 1234567890</p>
                    <p>✉️ info@beejaacademy.com</p>
                    <p>🌐 www.beejaacademy.com</p>
                </div>
                
                <div class="party-box">
                    <h3>Bill To</h3>
                    <p class="name">${userName}</p>
                    <p>Student</p>
                    <p>📞 ${userPhone}</p>
                    <p>✉️ ${userEmail}</p>
                </div>
            </div>
            
            <!-- Invoice Details -->
            <div class="invoice-details">
                <h3>📋 Invoice Information</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Invoice Date:</span>
                        <span class="detail-value">${purchaseDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">${order.transactionId}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Method:</span>
                        <span class="detail-value" style="text-transform: capitalize;">${order.paymentMethod}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Currency:</span>
                        <span class="detail-value">INR (₹)</span>
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Price</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="item-description">${courseName}</div>
                            <div class="item-details">
                                Lifetime Access • Digital Course<br>
                                Instructor: ${instructorName}
                            </div>
                        </td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">₹${order.originalPrice || order.amount}</td>
                        <td style="text-align: right; font-weight: 600;">₹${order.originalPrice || order.amount}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Totals -->
            <div class="totals-section">
                ${order.originalPrice > order.amount ? `
                <div class="total-row subtotal">
                    <span>Subtotal:</span>
                    <span>₹${order.originalPrice}</span>
                </div>
                <div class="total-row discount">
                    <span>Discount ${order.couponUsed?.code ? `(${order.couponUsed.code})` : ''}:</span>
                    <span>-₹${(order.originalPrice - order.amount).toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                    <span>Grand Total:</span>
                    <span class="amount">${order.amount === 0 ? 'Free' : `₹${order.amount}`}</span>
                </div>
            </div>
            
            <!-- Payment Info -->
            <div class="payment-info">
                <h3>Payment Status</h3>
                <span class="payment-status">✓ Paid</span>
                <p style="margin-top: 10px; font-size: 13px; color: #374151;">
                    Payment received successfully on ${purchaseDate}
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="invoice-footer">
            <h3>Thank you for choosing Beeja Academy!</h3>
            <p>Your trust in our educational platform means a lot to us.</p>
            
            <div class="contact-info">
                <p><strong>Contact Us:</strong></p>
                <p>📧 info@beejaacademy.com | 📱 +91 1234567890</p>
                <p>🌐 www.beejaacademy.com</p>
            </div>
            
            <p class="note">
                This is a computer-generated invoice. No signature is required.<br>
                © ${new Date().getFullYear()} Beeja Academy. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
};
