const socketInstance = require('./utils/socketInstance');
const onlineUsers = require('./utils/onlineUsers');
const rankQueue = require('./utils/rankQueue');
const matches = require('./utils/matches');
const User = require('./models/user.model');

module.exports = (io) => {
    console.log("✅ Socket.io server ready");
    socketInstance.set(io);

    io.on("connection", (socket) => {
        console.log(`✅ New socket connected: ${socket.id}`);

        // Khi user online
        socket.on("user:online", async (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`✅ User ${userId} online at socket ${socket.id}`);

            try {
                await User.findByIdAndUpdate(userId, { onlineStatus: 'online' });
                socket.broadcast.emit("user:online", { userId });
            } catch (err) {
                console.error(`❌ Error updating user ${userId} to online:`, err);
            }
        });

        // Bắt đầu trận thường
        socket.on("match:start", ({ player1, player2 }) => {
            matches.setMatch(player1, player2);
            console.log(`🎮 Match started between ${player1} and ${player2}`);
        });

        // Truyền nước cờ
        socket.on("move:send", ({ fromUser, move }) => {
            const opponentId = matches.getOpponent(fromUser);
            const opponentSocket = onlineUsers.get(opponentId);

            if (opponentSocket) {
                io.to(opponentSocket).emit("move:receive", { move, fromUser });
                console.log(`➡️ ${fromUser} đi: ${move} → gửi tới ${opponentId}`);
            } else {
                console.warn(`⚠️ Opponent ${opponentId} không online`);
            }
        });

        // Tìm trận rank
        socket.on("rank:find", async (userId) => {
            const user = await User.findById(userId);
            if (!user) return;

            const opponent = rankQueue.findMatch(user);
            if (opponent) {
                rankQueue.remove(opponent._id);
                matches.setMatch(user._id.toString(), opponent._id.toString());

                await User.updateMany(
                    { _id: { $in: [user._id, opponent._id] } },
                    { onlineStatus: 'in-game' }
                );

                const socket1 = onlineUsers.get(user._id.toString());
                const socket2 = onlineUsers.get(opponent._id.toString());

                io.to(socket1).emit("rank:matched", { opponent });
                io.to(socket2).emit("rank:matched", { opponent: user });
                console.log(`🥋 Rank Match: ${user.username} vs ${opponent.username}`);
            } else {
                rankQueue.add(user);
                socket.emit("rank:waiting");
                console.log(`⌛ ${user.username} đang chờ đối thủ trong hàng đợi`);
            }
        });

        // ❌ Hủy tìm trận rank
        socket.on("rank:cancel", async (userId) => {
            rankQueue.remove(userId);
            console.log(`🚫 User ${userId} hủy tìm trận rank`);
            socket.emit("rank:cancelled");
        });

        // ❌ Thoát trận đấu đang diễn ra
        socket.on("match:leave", async (userId) => {
            const opponentId = matches.getOpponent(userId);
            if (opponentId) {
                const opponentSocket = onlineUsers.get(opponentId);
                matches.removeMatch(userId);

                // Cập nhật trạng thái offline hoặc về 'online'
                await User.updateMany(
                    { _id: { $in: [userId, opponentId] } },
                    { onlineStatus: 'online' }
                );

                // Gửi thông báo tới đối thủ
                if (opponentSocket) {
                    io.to(opponentSocket).emit("match:left", { leaver: userId });
                }

                console.log(`🚪 User ${userId} đã rời trận với ${opponentId}`);
            }
        });

        // Ngắt kết nối
        socket.on("disconnect", async () => {
            const userId = onlineUsers.remove(socket.id);
            if (userId) {
                rankQueue.remove(userId);
                const opponentId = matches.getOpponent(userId);
                matches.removeMatch(userId);

                try {
                    await User.findByIdAndUpdate(userId, { onlineStatus: 'offline' });
                    socket.broadcast.emit("user:offline", { userId });
                    console.log(`❌ User ${userId} disconnected`);

                    if (opponentId) {
                        const opponentSocket = onlineUsers.get(opponentId);
                        if (opponentSocket) {
                            io.to(opponentSocket).emit("match:left", { leaver: userId });
                        }
                    }
                } catch (err) {
                    console.error(`❌ Error on disconnect:`, err);
                }
            }
        });
    });
};
