const mongoose = require('mongoose');
const Order = require('../models/order');
require('dotenv').config();

/**
 * Migration script to add invoice numbers to existing orders
 * This script will generate invoice numbers for all orders that don't have one
 */

async function addInvoiceNumbers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Find all orders without invoice numbers
        const ordersWithoutInvoice = await Order.find({ 
            $or: [
                { invoiceNumber: { $exists: false } },
                { invoiceNumber: null },
                { invoiceNumber: '' }
            ]
        }).sort({ purchaseDate: 1 });

        console.log(`📊 Found ${ordersWithoutInvoice.length} orders without invoice numbers`);

        if (ordersWithoutInvoice.length === 0) {
            console.log('✅ All orders already have invoice numbers');
            await mongoose.connection.close();
            return;
        }

        // Group orders by year-month
        const ordersByMonth = {};
        ordersWithoutInvoice.forEach(order => {
            const date = new Date(order.purchaseDate);
            const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!ordersByMonth[yearMonth]) {
                ordersByMonth[yearMonth] = [];
            }
            ordersByMonth[yearMonth].push(order);
        });

        let totalUpdated = 0;
        const sortedMonths = Object.keys(ordersByMonth).sort();

        for (const yearMonth of sortedMonths) {
            const orders = ordersByMonth[yearMonth];
            console.log(`\n📅 Processing ${orders.length} orders for ${yearMonth}`);

            // Find the highest existing invoice number for this month
            const existingInvoice = await Order.findOne({
                invoiceNumber: new RegExp(`^INV-${yearMonth}`)
            }).sort({ invoiceNumber: -1 });

            let sequence = 1;
            if (existingInvoice && existingInvoice.invoiceNumber) {
                const lastSequence = parseInt(existingInvoice.invoiceNumber.split('-')[2]);
                sequence = lastSequence + 1;
            }

            // Update each order
            for (const order of orders) {
                const invoiceNumber = `INV-${yearMonth}-${String(sequence).padStart(4, '0')}`;
                
                await Order.updateOne(
                    { _id: order._id },
                    { $set: { invoiceNumber: invoiceNumber } }
                );

                console.log(`  ✓ Order ${order._id} -> ${invoiceNumber}`);
                sequence++;
                totalUpdated++;
            }
        }

        console.log(`\n✅ Successfully added invoice numbers to ${totalUpdated} orders`);
        
        // Verify the update
        const remainingOrders = await Order.countDocuments({ 
            $or: [
                { invoiceNumber: { $exists: false } },
                { invoiceNumber: null },
                { invoiceNumber: '' }
            ]
        });
        
        if (remainingOrders === 0) {
            console.log('✅ All orders now have invoice numbers');
        } else {
            console.log(`⚠️ Warning: ${remainingOrders} orders still without invoice numbers`);
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error adding invoice numbers:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the migration
addInvoiceNumbers();
