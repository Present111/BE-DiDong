// src/utils/rankQueue.js
const queue = [];

module.exports = {
    add(user) {
        queue.push(user);
    },
    remove(userId) {
        const index = queue.findIndex(u => u._id.toString() === userId.toString());
        if (index !== -1) queue.splice(index, 1);
    },
    findMatch(user) {
        // Tìm người chơi khác trong queue có ELO gần nhất
        const threshold = 100; // chênh lệch ELO cho phép
        return queue.find(opponent =>
            opponent._id.toString() !== user._id.toString() &&
            Math.abs(opponent.elo - user.elo) <= threshold
        );
    },
    getQueue() {
        return queue;
    }
};
