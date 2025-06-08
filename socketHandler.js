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
    // Tìm trận rank
      socket.on("rank:find", async ({ userId, opponentId }) => {
  const user = await User.findById(userId);
  if (!user) return;

  const opponent = rankQueue.findMatch(user, opponentId); // ✅ truyền opponentId nếu có

  if (opponent) {
    rankQueue.remove(opponent._id);
    matches.setMatch(user._id.toString(), opponent._id.toString());

 

    const socket1 = onlineUsers.get(user._id.toString());
    const socket2 = onlineUsers.get(opponent._id.toString());

    if (socket1) io.to(socket1).emit("rank:matched", { opponent });
    if (socket2) io.to(socket2).emit("rank:matched", { opponent: user });

    console.log(`🥋 Rank Match: ${user.username} vs ${opponent.username}`);
  } else {
    rankQueue.add(user);
    socket.emit("rank:waiting");
    console.log(`⌛ ${user.username} đang chờ đối thủ trong hàng đợi`);
  }
});


socket.on("custom:play", ({ fromUser, toUser }) => {
  const toSocket = onlineUsers.get(toUser);
  if (!toSocket) {
    console.log(`⚠️ User ${toUser} không online. Nhưng kệ, không báo lỗi gì cả.`);
    return;
  }

  // ✅ Emit thẳng cho đối thủ, không gọi là “invite” nữa
  io.to(toSocket).emit("custom:play", { fromUser });

  console.log(`🎯 ${fromUser} bắt đầu custom play với ${toUser}`);
});


        // ❌ Hủy tìm trận rank
        socket.on("rank:cancel", async (userId) => {
            rankQueue.remove(userId);
            console.log(`🚫 User ${userId} hủy tìm trận rank`);
            socket.emit("rank:cancelled");
        });


                // Bắt đầu trận thường với 2 ID đã biết (giống rank nhưng không ghép cặp)
socket.on("match:custom", async ({ player1, player2 }) => {
    // ✅ Check nếu đã có trận giữa 2 người
    const existingOpponent1 = matches.getOpponent(player1);
    const existingOpponent2 = matches.getOpponent(player2);

    // Nếu đã có trận thì không tạo nữa
    if (existingOpponent1 === player2 && existingOpponent2 === player1) {
        console.log(`⚠️ Trận giữa ${player1} và ${player2} đã tồn tại. Bỏ qua.`);
        return;
    }

    // ❗ Nếu 1 trong 2 đã trong trận khác
    if (existingOpponent1 || existingOpponent2) {
        console.log(`❌ Một trong hai người chơi đã đang trong trận khác.`);
        return;
    }

    // ✅ Tạo trận mới
    matches.setMatch(player1, player2);

  
    const socket1 = onlineUsers.get(player1);
    const socket2 = onlineUsers.get(player2);

    if (socket1) io.to(socket1).emit("match:started", { opponentId: player2 });
    if (socket2) io.to(socket2).emit("match:started", { opponentId: player1 });

    console.log(`🧩 Trận thường bắt đầu: ${player1} vs ${player2}`);
});


socket.on("challenge:refresh", async (userId) => {
  const io = socketInstance.get();
  if (!io) return;

  try {
    // Tìm tất cả các user liên quan, bao gồm cả chính bản thân userId
    const users = await User.find({
      $or: [
        { _id: userId }, // 👈 THÊM: bản thân người gửi
        { waitId: userId },
        { "challenges.challengerId": userId },
        { "challenges.receiverId": userId }
      ]
    }).select("_id");

    users.forEach((u) => {
      const targetSocket = onlineUsers.get(u._id.toString());
      if (targetSocket) {
        io.to(targetSocket).emit("challenge:refresh", { fromUser: userId });
        console.log(`🔁 Emit challenge:refresh → ${u._id.toString()}`);
      }
    });
  } catch (err) {
    console.error("❌ Lỗi khi emit challenge:refresh:", err);
  }
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
