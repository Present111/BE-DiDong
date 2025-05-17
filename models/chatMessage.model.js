const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true   // ✅ hỗ trợ luôn emoji unicode
        },
        sentAt: {
            type: Date,
            default: Date.now   // ✅ lưu ngày giờ chính xác khi gửi
        },
        isRead1: {
            type: Boolean,
            default: false      // ✅ trạng thái đã đọc của user1
        },
        isRead2: {
            type: Boolean,
            default: false      // ✅ trạng thái đã đọc của user2
        }
        // Nếu sau này muốn thêm ảnh/icon dạng file → thêm imageUrl hoặc fileUrl ở đây
    }]
}, {
    timestamps: true
});


exports.getUnreadConversationCount = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: "Thiếu userId" });
        }

        const unreadConversations = await ChatMessage.find({
            $or: [
                { user1: userId, 'messages.isRead1': false },
                { user2: userId, 'messages.isRead2': false }
            ]
        }).select('_id'); // chỉ lấy ID

        res.json({ count: unreadConversations.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
module.exports = mongoose.model("ChatMessage", chatMessageSchema);
