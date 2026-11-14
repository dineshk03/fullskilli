const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    // Global theme for the whole site
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
