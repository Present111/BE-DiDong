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
        const candidates = queue.filter(opponent =>
            opponent._id.toString() !== user._id.toString()
        );

        if (candidates.length === 0) return null;

        // Tìm opponent có ELO gần nhất
        let closestOpponent = candidates[0];
        let minDiff = Math.abs(user.elo - closestOpponent.elo);

        for (let i = 1; i < candidates.length; i++) {
            const diff = Math.abs(user.elo - candidates[i].elo);
            if (diff < minDiff) {
                closestOpponent = candidates[i];
                minDiff = diff;
            }
        }

        return closestOpponent;
    },

    getQueue() {
        return queue;
    }
};
