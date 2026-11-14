const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Invoice PDF Buffer for Email Attachment
 * Uses PDFKit to create a professional PDF invoice
 */

exports.generateInvoicePDFBuffer = (order, user, course) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 40,
                bufferPages: true
            });

            // Collect PDF data in chunks
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

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

            // Colors
            const primaryColor = '#1F2937';
            const accentColor = '#FFD60A';
            const textColor = '#374151';
            const lightGray = '#F9FAFB';

            // Header with gradient effect (simulated with rectangles)
            doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
            
            // Company Logo/Name
            doc.fontSize(24)
               .fillColor('#FFFFFF')
               .text('Beeja Academy', 40, 25);
            
            doc.fontSize(10)
               .fillColor('#D1D5DB')
               .text('Excellence in Education', 40, 52);

            // Invoice Title and Number
            doc.fontSize(28)
               .fillColor(accentColor)
               .text('INVOICE', doc.page.width - 180, 25, { align: 'right', width: 140 });
            
            doc.fontSize(12)
               .fillColor('#FFFFFF')
               .text(invoiceNumber, doc.page.width - 180, 55, { align: 'right', width: 140 });

            // Accent line
            doc.rect(0, 100, doc.page.width, 2)
               .fill(accentColor);

            let yPos = 115;

            // Bill From and Bill To Section
            doc.fontSize(8)
               .fillColor('#6B7280')
               .text('BILL FROM', 40, yPos);
            
            doc.fontSize(8)
               .fillColor('#6B7280')
               .text('BILL TO', 320, yPos);

            yPos += 15;

            // Bill From Details
            doc.fontSize(11)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text('Beeja Academy', 40, yPos);
            
            doc.fontSize(8)
               .fillColor(textColor)
               .font('Helvetica')
               .text('Excellence in Education', 40, yPos + 14)
               .text('Phone: +91 1234567890', 40, yPos + 26)
               .text('Email: info@beejaacademy.com', 40, yPos + 38);

            // Bill To Details
            doc.fontSize(11)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text(userName, 320, yPos);
            
            doc.fontSize(8)
               .fillColor(textColor)
               .font('Helvetica')
               .text('Student', 320, yPos + 14)
               .text(`Phone: ${userPhone}`, 320, yPos + 26)
               .text(`Email: ${userEmail}`, 320, yPos + 38, { width: 235 });

            yPos += 60;

            // Invoice Details Box
            doc.rect(40, yPos, doc.page.width - 80, 55)
               .fillAndStroke(lightGray, '#E5E7EB');

            yPos += 10;

            doc.fontSize(10)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text('Invoice Information', 50, yPos);

            yPos += 18;

            // Invoice details in grid
            const detailsLeft = 50;
            const detailsRight = 310;

            doc.fontSize(7)
               .fillColor('#6B7280')
               .font('Helvetica')
               .text('Invoice Date:', detailsLeft, yPos)
               .text('Transaction ID:', detailsRight, yPos);

            doc.fontSize(7)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text(purchaseDate, detailsLeft, yPos + 9)
               .text(order.transactionId.substring(0, 22), detailsRight, yPos + 9);

            yPos += 20;

            doc.fontSize(7)
               .fillColor('#6B7280')
               .font('Helvetica')
               .text('Payment Method:', detailsLeft, yPos)
               .text('Currency:', detailsRight, yPos);

            doc.fontSize(7)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text(order.paymentMethod.toUpperCase(), detailsLeft, yPos + 9)
               .text('INR (Rs.)', detailsRight, yPos + 9);

            yPos += 30;

            // Items Table Header
            doc.rect(40, yPos, doc.page.width - 80, 22)
               .fill(primaryColor);

            doc.fontSize(8)
               .fillColor('#FFFFFF')
               .font('Helvetica-Bold')
               .text('DESCRIPTION', 50, yPos + 7)
               .text('QTY', 360, yPos + 7, { width: 40, align: 'center' })
               .text('PRICE', 430, yPos + 7, { width: 55, align: 'right' })
               .text('AMOUNT', 500, yPos + 7, { width: 55, align: 'right' });

            yPos += 22;

            // Item Row
            doc.rect(40, yPos, doc.page.width - 80, 42)
               .fillAndStroke('#FFFFFF', '#E5E7EB');

            yPos += 7;

            doc.fontSize(9)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text(courseName, 50, yPos, { width: 290 });

            doc.fontSize(7)
               .fillColor('#6B7280')
               .font('Helvetica')
               .text('Lifetime Access - Digital Course', 50, yPos + 12, { width: 290 })
               .text(`Instructor: ${instructorName}`, 50, yPos + 21, { width: 290 });

            doc.fontSize(8)
               .fillColor(textColor)
               .font('Helvetica')
               .text('1', 360, yPos + 7, { width: 40, align: 'center' });

            const itemPrice = order.originalPrice || order.amount;
            doc.text(`Rs. ${itemPrice}`, 430, yPos + 7, { width: 55, align: 'right' })
               .font('Helvetica-Bold')
               .text(`Rs. ${itemPrice}`, 500, yPos + 7, { width: 55, align: 'right' });

            yPos += 45;

            // Totals Section
            const totalsX = 360;
            const totalsWidth = 195;

            if (order.originalPrice > order.amount) {
                // Subtotal
                doc.fontSize(8)
                   .fillColor(textColor)
                   .font('Helvetica')
                   .text('Subtotal:', totalsX, yPos)
                   .text(`Rs. ${order.originalPrice}`, totalsX, yPos, { width: totalsWidth, align: 'right' });

                yPos += 15;

                // Discount
                const discount = (order.originalPrice - order.amount).toFixed(2);
                const discountText = order.couponUsed?.code ? `Discount (${order.couponUsed.code}):` : 'Discount:';
                
                doc.fontSize(8)
                   .fillColor('#10B981')
                   .font('Helvetica-Bold')
                   .text(discountText, totalsX, yPos)
                   .text(`-Rs. ${discount}`, totalsX, yPos, { width: totalsWidth, align: 'right' });

                yPos += 16;
            }

            // Grand Total
            doc.rect(totalsX, yPos - 3, totalsWidth, 24)
               .fill(primaryColor);

            doc.fontSize(10)
               .fillColor('#FFFFFF')
               .font('Helvetica-Bold')
               .text('Grand Total:', totalsX + 8, yPos + 4)
               .fillColor(accentColor)
               .fontSize(12)
               .text(order.amount === 0 ? 'Free' : `Rs. ${order.amount}`, totalsX + 8, yPos + 4, { width: totalsWidth - 16, align: 'right' });

            yPos += 32;

            // Payment Status
            doc.rect(40, yPos, doc.page.width - 80, 32)
               .fillAndStroke('#F0FDF4', '#10B981');

            doc.fontSize(9)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text('Payment Status', 50, yPos + 6);

            doc.fontSize(8)
               .fillColor('#10B981')
               .font('Helvetica-Bold')
               .text('Paid', 50, yPos + 19);

            doc.fontSize(7)
               .fillColor(textColor)
               .font('Helvetica')
               .text(`Payment received on ${purchaseDate}`, 90, yPos + 19);

            // Footer
            const footerY = doc.page.height - 80;
            
            doc.rect(0, footerY, doc.page.width, 80)
               .fill(lightGray);

            doc.fontSize(11)
               .fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text('Thank you for choosing Beeja Academy!', 40, footerY + 12, { 
                   width: doc.page.width - 80, 
                   align: 'center' 
               });

            doc.fontSize(8)
               .fillColor(textColor)
               .font('Helvetica')
               .text('Your trust in our educational platform means a lot to us.', 40, footerY + 28, { 
                   width: doc.page.width - 80, 
                   align: 'center' 
               });

            doc.fontSize(7)
               .fillColor('#6B7280')
               .text('Email: info@beejaacademy.com | Phone: +91 1234567890', 40, footerY + 44, { 
                   width: doc.page.width - 80, 
                   align: 'center' 
               });

            doc.fontSize(6)
               .fillColor('#9CA3AF')
               .font('Helvetica-Oblique')
               .text(`This is a computer-generated invoice. No signature required. © ${new Date().getFullYear()} Beeja Academy.`, 40, footerY + 58, { 
                   width: doc.page.width - 80, 
                   align: 'center' 
               });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
