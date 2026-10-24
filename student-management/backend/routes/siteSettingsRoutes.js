const router = require("express").Router();
const controller = require("../controllers/siteSettingsController");

router.get("/", controller.get);

module.exports = router;
