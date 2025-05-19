// src/utils/matches.js
const matches = new Map(); // userId → opponentId

module.exports = {
    setMatch(user1, user2) {
        matches.set(user1, user2);
        matches.set(user2, user1);
    },
    getOpponent(userId) {
        return matches.get(userId);
    },
    removeMatch(userId) {
        const opponent = matches.get(userId);
        if (opponent) {
            matches.delete(userId);
            matches.delete(opponent);
        }
    },
    getAllMatches() {
        return matches;
    }
};
