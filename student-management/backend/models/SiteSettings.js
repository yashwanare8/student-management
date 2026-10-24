const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "site" },
  backgroundColor: { type: String, required: true, default: "#f2f5f9" }
}, { timestamps: true });

module.exports = mongoose.model("SiteSettings", siteSettingsSchema, "siteSettings");
