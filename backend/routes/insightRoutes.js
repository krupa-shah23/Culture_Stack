const express = require("express");
const router = express.Router();
const insightController = require("../controllers/insightController");
const { protect } = require("../middleware/authMiddleware");

// All insight routes require authentication
router.use(protect);

router.post("/", insightController.createInsight);
router.get("/", insightController.getUserInsights);
router.get("/:roomName", insightController.getRoomInsights);

module.exports = router;
