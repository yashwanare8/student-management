const SiteSettings = require("../models/SiteSettings");

const defaultBackgroundColor = "#f2f5f9";
const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

exports.get = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({ key: "site" }).lean();
    res.json({
      success: true,
      data: { backgroundColor: settings?.backgroundColor || defaultBackgroundColor }
    });
  } catch (err) {
    console.error("Failed to read site settings:", err.message);
    res.status(500).json({ success: false, message: "Unable to load site settings" });
  }
};

exports.update = async (req, res) => {
  const backgroundColor = req.body?.backgroundColor;
  if (typeof backgroundColor !== "string" || !hexColorPattern.test(backgroundColor)) {
    return res.status(400).json({
      success: false,
      message: "backgroundColor must be a 3- or 6-digit hex color, such as #1f3a68"
    });
  }

  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "site" },
      { $set: { backgroundColor: backgroundColor.toUpperCase() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({
      success: true,
      message: "Website background updated",
      data: { backgroundColor: settings.backgroundColor }
    });
  } catch (err) {
    console.error("Failed to update site settings:", err.message);
    res.status(500).json({ success: false, message: "Unable to update site settings" });
  }
};
