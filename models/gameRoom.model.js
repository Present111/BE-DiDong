// models/gameRoom.model.js
const mongoose = require("mongoose");

const gameRoomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    players: [{
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        color: { type: String, enum: ["black", "white"] }
    }],
    currentTurn: { type: String, enum: ["black", "white"], default: "black" },
    moves: [{
        player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        move: String,
        order: Number
    }],
    isRanked: { type: Boolean, default: false },
    status: { type: String, enum: ["waiting", "playing", "ended"], default: "waiting" }
}, { timestamps: true });

module.exports = mongoose.model("GameRoom", gameRoomSchema);
