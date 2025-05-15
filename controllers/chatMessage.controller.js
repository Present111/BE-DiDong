// controllers/chatMessage.controller.js
const ChatMessage = require("../models/chatMessage.model");
const User = require("../models/user.model");
const socketInstance = require("../utils/socketInstance");   // ✅ lấy socket io instance
const onlineUsers = require("../utils/onlineUsers");         // ✅ lấy danh sách user online

exports.createConversation = async (req, res) => {
    try {
        const { user1, user2 } = req.body;

        // Kiểm tra nếu đã có cuộc trò chuyện giữa 2 user này
        let conversation = await ChatMessage.findOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 }
            ]
        });

        if (!conversation) {
            conversation = new ChatMessage({ user1, user2, messages: [] });
            await conversation.save();
        }

        res.status(200).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { sender, text } = req.body;

        const conversation = await ChatMessage.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        // Xác định user1 và user2
        const user1Id = conversation.user1.toString();
        const user2Id = conversation.user2.toString();

        // Xác định trạng thái đọc cho người gửi
        const isSenderUser1 = sender === user1Id;
        const message = {
            sender,
            text,
            sentAt: new Date(),
            isRead1: isSenderUser1,
            isRead2: !isSenderUser1
        };

        conversation.messages.push(message);
        await conversation.save();

        // Emit socket cho cả 2 user
        const io = socketInstance.get();
        const participants = [user1Id, user2Id];
        participants.forEach(userId => {
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                io.to(socketId).emit("chat:list:refresh");
            }
        });

        res.status(200).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await ChatMessage.findById(conversationId)
         

        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        res.status(200).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// exports.getConversationsByUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const conversations = await ChatMessage.find({
//             $or: [{ user1: userId }, { user2: userId }]
//         }).populate('user1 user2');

//         res.status(200).json(conversations);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };


exports.getConversationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Lấy danh sách friends đã là friend
        const currentUser = await User.findById(userId);
        if (!currentUser) return res.status(404).json({ error: "User not found" });

        const friendIds = currentUser.friends
            .filter(f => f.status === 'friend')
            .map(f => f.friendId.toString());

        // Tìm tất cả conversations có userId
        const conversations = await ChatMessage.find({
            $or: [{ user1: userId }, { user2: userId }]
        }).populate('user1 user2 messages.sender');

        const result = conversations
            .filter(conv => {
                const friendId = conv.user1._id.toString() === userId
                    ? conv.user2._id.toString()
                    : conv.user1._id.toString();
                // ✅ Chỉ lấy nếu friendId nằm trong danh sách friends
                return friendIds.includes(friendId);
            })
            .map(conv => {
                const isUser1 = conv.user1._id.toString() === userId;
                const friend = isUser1 ? conv.user2 : conv.user1;

                const lastMessage = conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1]
                    : null;

                const unreadCount = conv.messages.filter(msg => {
                    const fromFriend = msg.sender._id.toString() === friend._id.toString();
                    const notRead = isUser1 ? !msg.isRead1 : !msg.isRead2;
                    return fromFriend && notRead;
                }).length;

                return {
                    conversationId: conv._id,
                    friend: {
                        _id: friend._id,
                        username: friend.username,
                        displayName: friend.displayName,
                        avatarUrl: friend.avatarUrl
                    },
                    lastMessage: lastMessage ? lastMessage.text : '',
                    lastMessageTime: lastMessage ? lastMessage.sentAt : null,
                    unreadCount: unreadCount,
                    isYou: lastMessage ? lastMessage.sender._id.toString() === userId : false
                };
            });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.markAllMessagesRead = async (req, res) => {
    try {
        const { conversationId, userId } = req.params;
        const conversation = await ChatMessage.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        const isUser1 = conversation.user1.toString() === userId;
        const isUser2 = conversation.user2.toString() === userId;

        if (!isUser1 && !isUser2) {
            return res.status(403).json({ error: "User not in conversation" });
        }

        // ✅ Đánh dấu tất cả message
        conversation.messages.forEach(msg => {
            if (isUser1) msg.isRead1 = true;
            if (isUser2) msg.isRead2 = true;
        });

        await conversation.save();

        // Nếu muốn cũng có thể emit socket event như chat:list:refresh ở đây

        res.status(200).json({ message: "All messages marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
