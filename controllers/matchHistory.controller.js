// controllers/matchHistory.controller.js
const MatchHistory = require("../models/matchHistory.model");

// Lấy toàn bộ match history
exports.getAllMatches = async (req, res) => {
    try {
        const matches = await MatchHistory.find()
            .populate("playerBlack", "username")
            .populate("playerWhite", "username")
            .sort({ createdAt: -1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo mới match
exports.createMatch = async (req, res) => {
    try {
        const match = new MatchHistory(req.body);
        await match.save();
        res.status(201).json(match);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Lấy chi tiết 1 match theo ID
exports.getMatchById = async (req, res) => {
    try {
        const match = await MatchHistory.findById(req.params.id)
            .populate("playerBlack", "username")
            .populate("playerWhite", "username");
        if (!match) return res.status(404).json({ message: "Match not found" });
        res.json(match);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa match theo ID
exports.deleteMatch = async (req, res) => {
    try {
        const match = await MatchHistory.findByIdAndDelete(req.params.id);
        if (!match) return res.status(404).json({ message: "Match not found" });
        res.json({ message: "Match deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
