// models/matchHistory.model.js
const mongoose = require("mongoose");

const matchHistorySchema = new mongoose.Schema({
    playerBlack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    playerWhite: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    winner: {
        type: String,
        enum: ['black', 'white', 'draw']
    },
    type: {
        type: String,
        enum: ['ranked', 'friendly', 'bot'],  // ✅ loại trận
        default: 'friendly'
    },
    moves: [{
        order: {
            type: Number
        },
        move: {
            type: String
        }
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    resultDescription: {
        type: String
    },
    deltaElo: {
        type: Number,      // ✅ thay đổi Elo
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("MatchHistory", matchHistorySchema);
