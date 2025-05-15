const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true },
    googleId: { type: String, default: "" },                  // 👈 Thêm dòng này
    password: { type: String, required: true },
    displayName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    elo: { type: Number, default: 1000 },
    onlineStatus: { type: String, enum: ['online', 'offline', 'in-game'], default: 'offline' },
    dateOfBirth: { type: Date },
    nationality: { type: String, default: "" },
    matchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "MatchHistory"
    }],
    friends: [{
        friendId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
            default: null
        },
        status: {
            type: String,
            enum: ['friend', 'request', 'removed'],
            default: 'request'
        }
    }],
    challenges: [{
        challengerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'cancelled'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
