const router = require("express").Router();
const controller = require("../controllers/siteSettingsController");

router.put("/", controller.update);

module.exports = router;
