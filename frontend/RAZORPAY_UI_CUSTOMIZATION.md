# Razorpay Payment UI Customization Guide

## Overview
This document describes all the UI customizations applied to the Razorpay payment modal for Beeja Academy.

## Current Theme Configuration

### Color Scheme
```javascript
theme: {
  color: "#7561FA",  // Purple/Indigo - Premium look
  backdrop_color: "rgba(15, 23, 42, 0.9)",  // Dark backdrop
  image_padding: false,
  image_frame: true,
}
```

### Available Color Options

| **Theme Name** | **Color Code** | **Use Case** |
|----------------|---------------|--------------|
| **Purple Premium** | `#7561FA` | Current - Premium, creative |
| **Professional Blue** | `#216AFD` | Corporate, trustworthy |
| **Success Green** | `#22C55E` | Eco-friendly, secure |
| **Vibrant Orange** | `#EA580C` | Energetic, action-oriented |
| **Royal Purple** | `#B55DFE` | Luxury, exclusive |
| **Teal Modern** | `#59D3D9` | Fresh, modern |
| **Dark Blue** | `#254FA3` | Professional, stable |
| **Yellow Bright** | `#FFD60A` | Cheerful, attention-grabbing |

## Payment Methods Configuration

### Display Order
The payment methods are displayed in this sequence:
1. **UPI** (Recommended - Most popular in India)
2. **Cards** (Credit/Debit)
3. **Netbanking**
4. **Wallets** (Paytm, PhonePe, etc.)

### Custom Labels
```javascript
blocks: {
  upi: { name: 'Pay using UPI' },
  card: { name: 'Pay using Cards' },
  banks: { name: 'Pay using Netbanking' },
  wallet: { name: 'Pay using Wallet' },
}
```

## Modal Behavior

### User Experience Features
- ✅ **Confirmation before close** - Prevents accidental closure
- ✅ **ESC key enabled** - Quick close option
- ✅ **Smooth animations** - Professional transitions
- ✅ **Backdrop click disabled** - Prevents accidental closure
- ✅ **Remember customer** - Faster future payments
- ✅ **SMS hash autofill** - Auto-fills OTP from SMS

### Readonly Fields
All user details are pre-filled and locked:
- Name (readonly)
- Email (readonly)
- Contact (readonly)

## Branding

### Current Setup
- **Business Name**: "Beeja Academy"
- **Description**: "Premium Course Enrollment"
- **Logo**: Beeja Academy logo (Logo-Small-Light.png)
- **Logo Frame**: Enabled for better visibility

## Advanced Customization Options

### To Change Theme Color
Edit `studentFeaturesAPI.js` line 191:
```javascript
color: "#YOUR_COLOR_HERE",
```

### To Change Payment Method Order
Edit the `sequence` array (line 143):
```javascript
sequence: ['upi', 'card', 'banks', 'wallet'],
// Reorder as needed
```

### To Disable Specific Payment Methods
Remove from the `blocks` object:
```javascript
// Example: Remove wallet option
blocks: {
  upi: { ... },
  card: { ... },
  banks: { ... },
  // wallet: { ... },  // Commented out
}
```

### To Change Backdrop Opacity
Edit line 192:
```javascript
backdrop_color: "rgba(15, 23, 42, 0.9)",
//                                  ^^^
//                                  0.0 (transparent) to 1.0 (opaque)
```

## Modal Customization Options

### Available Settings
```javascript
modal: {
  ondismiss: function() { ... },     // Called when modal closes
  confirm_close: true,                // Ask before closing
  escape: true,                       // Allow ESC key
  animation: true,                    // Enable animations
  backdropclose: false,               // Disable backdrop click
}
```

### Behavior Options
- `confirm_close: true` - Shows "Are you sure?" dialog
- `escape: true` - Allows ESC key to close
- `animation: true` - Smooth open/close animations
- `backdropclose: false` - Prevents accidental closure

## Notes and Metadata

### Transaction Notes
Every payment includes:
```javascript
notes: {
  course_purchase: "true",
  platform: "Beeja LMS"
}
```

These notes appear in:
- Razorpay Dashboard
- Payment receipts
- Transaction history
- Webhook notifications

## Testing Different Themes

### Quick Theme Switcher
To test different themes quickly, change the color value:

**Professional Blue:**
```javascript
color: "#216AFD",
```

**Success Green:**
```javascript
color: "#22C55E",
```

**Vibrant Orange:**
```javascript
color: "#EA580C",
```

**Royal Purple:**
```javascript
color: "#B55DFE",
```

## Responsive Design

The Razorpay modal is fully responsive:
- **Desktop**: Full-width modal with side panels
- **Tablet**: Adjusted width, stacked layout
- **Mobile**: Full-screen modal, optimized touch targets

## Security Features

### Built-in Security
- ✅ PCI DSS compliant
- ✅ 256-bit SSL encryption
- ✅ 3D Secure authentication
- ✅ CVV verification
- ✅ OTP validation
- ✅ Fraud detection

### User Data Protection
- Email, phone, and name are readonly
- No card details stored locally
- All transactions encrypted
- Secure payment gateway

## Accessibility

### Keyboard Navigation
- Tab through payment options
- Enter to select
- ESC to close (if enabled)
- Arrow keys for navigation

### Screen Reader Support
- Proper ARIA labels
- Descriptive button text
- Status announcements
- Error messages

## Browser Support

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Samsung Internet
- ✅ UC Browser

## Troubleshooting

### Modal Not Opening
1. Check if Razorpay script loaded
2. Verify API keys are correct
3. Check browser console for errors
4. Ensure amount is greater than 0

### Theme Not Applying
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check color code format (#RRGGBB)
4. Verify theme object syntax

### Payment Methods Not Showing
1. Check Razorpay account settings
2. Verify payment methods are enabled
3. Check config.display.blocks
4. Ensure sequence array is correct

## Best Practices

### Color Selection
- Use high contrast colors
- Test with colorblind simulators
- Ensure readability on all backgrounds
- Match your brand colors

### User Experience
- Keep payment flow simple
- Pre-fill all possible fields
- Show clear error messages
- Provide payment confirmation

### Performance
- Load Razorpay script only when needed
- Use dynamic imports for animations
- Minimize modal open time
- Cache customer details

## Future Enhancements

### Planned Features
- [ ] Multi-currency support
- [ ] Subscription payments
- [ ] Saved cards display
- [ ] Payment method recommendations
- [ ] Discount code integration
- [ ] Gift card support
- [ ] EMI options display
- [ ] International cards

## Support

### Razorpay Documentation
- [Checkout Options](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/checkout-options/)
- [Theme Customization](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/customize-checkout/)
- [Payment Methods](https://razorpay.com/docs/payments/payment-methods/)

### Contact
For Beeja Academy specific issues:
- Check PAYMENT_ANIMATIONS.md for animation issues
- Review studentFeaturesAPI.js for integration code
- Test with Razorpay test keys first

## Changelog

### Version 1.2.0 (Current)
- Changed theme to purple (#7561FA)
- Added payment method ordering
- Enabled confirm_close dialog
- Added readonly fields
- Implemented remember_customer
- Added SMS hash autofill

### Version 1.1.0
- Changed from yellow to blue theme
- Updated logo to Beeja Academy
- Changed name from "Beeja LMS" to "Beeja Academy"

### Version 1.0.0
- Initial Razorpay integration
- Basic theme customization
- Payment verification flow
