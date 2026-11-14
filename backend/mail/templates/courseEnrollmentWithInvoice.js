exports.courseEnrollmentWithInvoice = (courseName, name, order) => {
    const invoiceNumber = order.invoiceNumber || `INV-${order._id.slice(-8).toUpperCase()}`;
    const purchaseDate = new Date(order.purchaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Course Enrollment Confirmation & Invoice</title>
        <style>
            body {
                background-color: #f5f5f5;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            
            .email-container {
                max-width: 650px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #FFD60A 0%, #FFC300 100%);
                padding: 30px 20px;
                text-align: center;
                color: #000000;
            }
            
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            
            .header .emoji {
                font-size: 48px;
                margin-bottom: 10px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .success-badge {
                background-color: #10B981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            
            .course-info {
                background-color: #F9FAFB;
                border-left: 4px solid #FFD60A;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            
            .course-name {
                font-size: 20px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 10px;
            }
            
            .invoice-section {
                background-color: #F3F4F6;
                padding: 20px;
                margin: 30px 0;
                border-radius: 8px;
                border: 2px dashed #D1D5DB;
            }
            
            .invoice-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .invoice-header h2 {
                color: #1F2937;
                margin: 0 0 10px 0;
                font-size: 24px;
            }
            
            .invoice-number {
                background-color: #FFD60A;
                color: #000000;
                padding: 8px 16px;
                border-radius: 5px;
                display: inline-block;
                font-weight: bold;
                font-size: 16px;
            }
            
            .invoice-details {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                margin-top: 15px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #E5E7EB;
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                color: #6B7280;
                font-weight: 500;
            }
            
            .detail-value {
                color: #1F2937;
                font-weight: 600;
            }
            
            .amount-section {
                background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
                color: white;
                padding: 20px;
                border-radius: 5px;
                margin-top: 15px;
            }
            
            .amount-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
            }
            
            .total-amount {
                font-size: 24px;
                font-weight: bold;
                color: #FFD60A;
                border-top: 2px solid #4B5563;
                padding-top: 15px;
                margin-top: 10px;
            }
            
            .discount-text {
                color: #10B981;
            }
            
            .cta-button {
                display: inline-block;
                padding: 15px 40px;
                background: linear-gradient(135deg, #FFD60A 0%, #FFC300 100%);
                color: #000000;
                text-decoration: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
            }
            
            .benefits {
                background-color: #EFF6FF;
                border-left: 4px solid #3B82F6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            
            .benefits h3 {
                color: #1F2937;
                margin-top: 0;
                font-size: 18px;
            }
            
            .benefits ul {
                margin: 10px 0;
                padding-left: 20px;
            }
            
            .benefits li {
                margin: 8px 0;
                color: #374151;
            }
            
            .footer {
                background-color: #F9FAFB;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #E5E7EB;
            }
            
            .footer-links {
                margin: 15px 0;
            }
            
            .footer-links a {
                color: #3B82F6;
                text-decoration: none;
                margin: 0 10px;
            }
            
            .support {
                font-size: 14px;
                color: #6B7280;
                margin-top: 15px;
            }
            
            .social-links {
                margin: 15px 0;
            }
            
            .social-links a {
                display: inline-block;
                margin: 0 5px;
                color: #6B7280;
                text-decoration: none;
            }
            
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 10px;
                }
                
                .content {
                    padding: 20px 15px;
                }
                
                .detail-row {
                    flex-direction: column;
                    gap: 5px;
                }
            }
        </style>
    </head>
    
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="emoji">🎓</div>
                <h1>Beeja Academy</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Excellence in Education</p>
            </div>
            
            <!-- Content -->
            <div class="content">
                <div style="text-align: center;">
                    <span class="success-badge">✓ Enrollment Successful</span>
                </div>
                
                <p style="font-size: 18px; color: #1F2937;">Dear <strong>${name}</strong>,</p>
                
                <p>Congratulations! 🎉 You have successfully enrolled in:</p>
                
                <div class="course-info">
                    <div class="course-name">${courseName}</div>
                    <p style="margin: 0; color: #6B7280;">You now have lifetime access to all course materials</p>
                </div>
                
                <p>We're excited to have you join our learning community. Your journey to mastering new skills starts now!</p>
                
                <!-- Invoice Section -->
                <div class="invoice-section">
                    <div class="invoice-header">
                        <h2>📄 Invoice Details</h2>
                        <span class="invoice-number">${invoiceNumber}</span>
                    </div>
                    
                    <div class="invoice-details">
                        <div class="detail-row">
                            <span class="detail-label">Invoice Date:</span>
                            <span class="detail-value">${purchaseDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Transaction ID:</span>
                            <span class="detail-value">${order.transactionId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment Method:</span>
                            <span class="detail-value" style="text-transform: capitalize;">${order.paymentMethod}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Course:</span>
                            <span class="detail-value">${courseName}</span>
                        </div>
                    </div>
                    
                    <div class="amount-section">
                        ${order.originalPrice > order.amount ? `
                        <div class="amount-row">
                            <span>Original Price:</span>
                            <span>₹${order.originalPrice}</span>
                        </div>
                        <div class="amount-row discount-text">
                            <span>Discount ${order.couponUsed?.code ? `(${order.couponUsed.code})` : ''}:</span>
                            <span>-₹${(order.originalPrice - order.amount).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="amount-row total-amount">
                            <span>Total Paid:</span>
                            <span>${order.amount === 0 ? 'Free' : `₹${order.amount}`}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Benefits -->
                <div class="benefits">
                    <h3>🌟 What's Next?</h3>
                    <ul>
                        <li><strong>Access Your Course:</strong> Start learning immediately from your dashboard</li>
                        <li><strong>Lifetime Access:</strong> Learn at your own pace, anytime, anywhere</li>
                        <li><strong>Certificate:</strong> Earn a certificate upon course completion</li>
                        <li><strong>Support:</strong> Get help from instructors and community</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a class="cta-button" href="${process.env.FRONTEND_URL || 'http://35.177.233.147:5173'}/dashboard/enrolled-courses">
                        Start Learning Now →
                    </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
                    <strong>Note:</strong> You can download your invoice anytime from your purchase history in the dashboard.
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0; font-weight: bold; color: #1F2937;">Beeja Academy</p>
                <p style="margin: 5px 0; font-size: 14px; color: #6B7280;">Empowering learners worldwide</p>
                
                <div class="footer-links">
                    <a href="${process.env.FRONTEND_URL || 'http://35.177.233.147:5173'}/dashboard/enrolled-courses">My Courses</a> |
                    <a href="${process.env.FRONTEND_URL || 'http://35.177.233.147:5173'}/dashboard/purchase-history">Purchase History</a> |
                    <a href="${process.env.FRONTEND_URL || 'http://35.177.233.147:5173'}/contact">Support</a>
                </div>
                
                <div class="support">
                    Need help? Contact us at 
                    <a href="mailto:info@beejaacademy.com" style="color: #3B82F6;">info@beejaacademy.com</a>
                    <br>or call us at <strong>+91 1234567890</strong>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;">
                    This is an automated email. Please do not reply to this message.
                    <br>© ${new Date().getFullYear()} Beeja Academy. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>`;
};
