// src/utils/onlineUsers.js
const onlineUsers = new Map();       // userId → socketId
const socketToUser = new Map();      // socketId → userId

module.exports = {
    set(userId, socketId) {
        onlineUsers.set(userId, socketId);
        socketToUser.set(socketId, userId);
    },
    get(userId) {
        return onlineUsers.get(userId);
    },
    remove(socketId) {
        const userId = socketToUser.get(socketId);
        if (userId) {
            onlineUsers.delete(userId);
            socketToUser.delete(socketId);
            return userId;
        }
        return null;
    },
    getAll() {
        return Array.from(onlineUsers.keys());
    }
};
