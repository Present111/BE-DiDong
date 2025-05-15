// src/socketHandler.js
const socketInstance = require('./utils/socketInstance');
const onlineUsers = require('./utils/onlineUsers');
const User = require('./models/user.model');   // ✅ thêm model User vào

module.exports = (io) => {
    console.log("✅ Socket.io server ready");
    socketInstance.set(io);

    io.on("connection", (socket) => {
        console.log(`✅ New socket connected: ${socket.id}`);

        socket.on("user:online", async (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`✅ User ${userId} online at socket ${socket.id}`);

            // ✅ cập nhật User onlineStatus = 'online'
            try {
                await User.findByIdAndUpdate(userId, { onlineStatus: 'online' });
            } catch (err) {
                console.error(`❌ Error updating user ${userId} to online:`, err);
            }

            // ✅ thông báo cho tất cả client khác
            socket.broadcast.emit("user:online", { userId });
        });

        socket.on("disconnect", async () => {
            const userId = onlineUsers.remove(socket.id);
            if (userId) {
                console.log(`❌ User ${userId} offline at socket ${socket.id}`);

                // ✅ cập nhật User onlineStatus = 'offline'
                try {
                    await User.findByIdAndUpdate(userId, { onlineStatus: 'offline' });
                } catch (err) {
                    console.error(`❌ Error updating user ${userId} to offline:`, err);
                }

                // ✅ thông báo cho tất cả client khác
                socket.broadcast.emit("user:offline", { userId });
            }
        });
    });
};
