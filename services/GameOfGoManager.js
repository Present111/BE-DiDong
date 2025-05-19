const { spawn } = require("child_process");
const path = require("path");

class GameOfGoManager {
    constructor() {
        this.sessions = new Map(); // userId => { engine, sendCommand, match }
    }

    async createMatch(userId, difficulty, playerColor, boardSize = 19) {
        const gtpPath = path.join(__dirname, "../go/gtp/gtp.js");
        const engine = spawn("node", [gtpPath]);
        const buffer = { data: "" };
        const callbacks = [];

        // Lắng nghe phản hồi GTP engine
        engine.stdout.on("data", (data) => {
            const output = data.toString();
            buffer.data += output;

            if (output.includes("\n\n") || output.includes("\n=")) {
                const response = buffer.data.trim();
                buffer.data = "";
                const callback = callbacks.shift();
                if (callback) callback(response);
            }
        });

        engine.stderr.on("data", (data) => {
            console.error(`❌ [${userId}] Engine error: ${data}`);
        });

        engine.on("close", (code) => {
            console.log(`❌ [${userId}] Engine exited with code ${code}`);
            this.sessions.delete(userId);
        });

        const sendCommand = (cmd) => {
            return new Promise((resolve, reject) => {
                if (!engine) return reject("❌ Engine chưa khởi động");
                callbacks.push(resolve);
                engine.stdin.write(`${cmd}\n`);
            });
        };

        // Setup bàn cờ
        await sendCommand(`boardsize ${boardSize}`);
        await sendCommand("clear_board");

        const matchData = {
            difficulty,
            playerColor,
            boardSize,
            history: [],
        };

        // Nếu người chơi chọn trắng, AI (đen) phải đi trước
        if (playerColor === "W") {
            const aiMove = await sendCommand("genmove B");
            matchData.history.push({ player: "AI", move: aiMove.trim() });
            console.log(`🤖 [${userId}] AI (B) mở màn với: ${aiMove}`);
        }

        this.sessions.set(userId, {
            engine,
            sendCommand,
            match: matchData,
        });

        console.log(`✅ Tạo phiên cho user ${userId} thành công`);
    }

    getSession(userId) {
        return this.sessions.get(userId);
    }

    async stopMatch(userId) {
        const session = this.sessions.get(userId);
        if (!session) return false;
        session.engine.kill();
        this.sessions.delete(userId);
        console.log(`🛑 Đã dừng engine cho user ${userId}`);
        return true;
    }
}

module.exports = new GameOfGoManager();
