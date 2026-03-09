const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
    {
        roomName: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        keyPoints: [
            {
                type: String,
                trim: true,
            },
        ],
        decisions: [
            {
                type: String,
                trim: true,
            },
        ],
        actionItems: [
            {
                type: String,
                trim: true,
            },
        ],
        questions: [
            {
                type: String,
                trim: true,
            },
        ],
    },
    { timestamps: true }
);

const Insight = mongoose.models.Insight || mongoose.model("Insight", insightSchema);

module.exports = Insight;
