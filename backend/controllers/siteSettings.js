const SiteSettings = require('../models/siteSettings');

const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne({});
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return settings;
};

exports.getPublicSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      data: {
        theme: settings.theme,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings',
      error: error.message,
    });
  }
};

exports.getAdminSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings',
      error: error.message,
    });
  }
};

exports.updateAdminSiteSettings = async (req, res) => {
  try {
    const { theme } = req.body;

    if (theme !== undefined && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be one of: light, dark, system',
      });
    }

    const settings = await getOrCreateSettings();

    if (theme !== undefined) {
      settings.theme = theme;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      data: settings,
      message: 'Site settings updated',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update site settings',
      error: error.message,
    });
  }
};
