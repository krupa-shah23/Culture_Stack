const Insight = require("../models/Insight");

exports.createInsight = async (req, res) => {
    try {
        const { roomName, keyPoints = [], decisions = [], actionItems = [], questions = [] } = req.body;

        // Prevent storing completely empty insights
        if (!keyPoints.length && !decisions.length && !actionItems.length && !questions.length) {
            return res.status(400).json({ message: "No insights generated to save" });
        }

        if (!roomName) {
            return res.status(400).json({ message: "Room name is required" });
        }

        const insight = new Insight({
            roomName,
            createdBy: req.user._id,
            keyPoints,
            decisions,
            actionItems,
            questions,
        });

        await insight.save();
        res.status(201).json(insight);
    } catch (error) {
        console.error("Error saving meeting insights: ", error);
        res.status(500).json({ message: "Failed to save meeting insights" });
    }
};

exports.getUserInsights = async (req, res) => {
    try {
        const insights = await Insight.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 })
            .populate("createdBy", "fullName username profilePicture");

        res.status(200).json(insights);
    } catch (error) {
        console.error("Error fetching user insights: ", error);
        res.status(500).json({ message: "Failed to fetch user insights" });
    }
};

exports.getRoomInsights = async (req, res) => {
    try {
        const { roomName } = req.params;

        const insights = await Insight.find({ roomName })
            .sort({ createdAt: -1 })
            .populate("createdBy", "fullName username profilePicture");

        res.status(200).json(insights);
    } catch (error) {
        console.error("Error fetching room insights: ", error);
        res.status(500).json({ message: "Failed to fetch room insights" });
    }
};
