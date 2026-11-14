const Coupon = require('../models/coupon');

const money = value => Math.round(Number(value) * 100) / 100;

async function checkoutPricing(courses, couponCode, userId, now = new Date()) {
    const total = money(courses.reduce((sum, course) => {
        const price = course.adminSetFree || course.courseType === 'Free' ? 0 : Number(course.price);
        if (!Number.isFinite(price) || price < 0) throw new Error('Invalid course price');
        return sum + price;
    }, 0));
    if (!couponCode) return { total, discount: 0, amount: total };
    const code = String(couponCode).trim().toUpperCase();
    // Preserve the published bundle offer, but calculate its value on the server.
    if (/^BUNDLE_DISCOUNT_\d+PERCENT$/.test(code)) {
        const rate = courses.length >= 3 ? 0.15 : courses.length >= 2 ? 0.10 : 0;
        if (!rate || code !== `BUNDLE_DISCOUNT_${rate * 100}PERCENT`) throw new Error('Invalid bundle discount');
        const discount = Math.round(total * rate);
        return { total, discount, amount: money(total - discount) };
    }
    const coupon = await Coupon.findOne({ code });
    if (!coupon || !coupon.isActive || now < coupon.startDate || now >= coupon.expiryDate ||
        (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) || total < coupon.minimumOrderAmount) {
        throw new Error('Coupon is invalid, expired, or unavailable');
    }
    const usage = coupon.userUsage.find(item => String(item.user) === String(userId));
    if (coupon.perUserLimit > 0 && (usage?.usedCount || 0) >= coupon.perUserLimit) throw new Error('Coupon usage limit reached');
    if (coupon.linkedTo === 'bundle' && courses.length < 2) throw new Error('Coupon requires a bundle');
    if (courses.some(course => (coupon.courses.length && !coupon.courses.some(id => String(id) === String(course._id))) ||
        (coupon.categories.length && !coupon.categories.some(id => String(id) === String(course.category))))) {
        throw new Error('Coupon is not applicable to these courses');
    }
    let discount = coupon.discountType === 'percentage' ? total * coupon.discountValue / 100 : coupon.discountValue;
    if (coupon.maxDiscountAmount > 0) discount = Math.min(discount, coupon.maxDiscountAmount);
    discount = money(Math.min(total, Math.max(0, discount)));
    return { total, discount, amount: money(total - discount), coupon };
}

function allocatePrices(courses, discount) {
    const prices = courses.map(course => Math.round((course.adminSetFree || course.courseType === 'Free' ? 0 : Number(course.price)) * 100));
    const total = prices.reduce((sum, price) => sum + price, 0);
    const discountCents = Math.round(discount * 100);
    const reductions = prices.map(price => total ? Math.floor(price / total * discountCents) : 0);
    let remaining = discountCents - reductions.reduce((sum, value) => sum + value, 0);
    for (let i = 0; remaining > 0 && i < prices.length; i++) {
        if (reductions[i] < prices[i]) { reductions[i]++; remaining--; }
    }
    return prices.map((price, index) => {
        const reduction = reductions[index];
        return { originalPrice: price / 100, discountAmount: reduction / 100, amount: (price - reduction) / 100 };
    });
}
module.exports = { checkoutPricing, money, allocatePrices };
