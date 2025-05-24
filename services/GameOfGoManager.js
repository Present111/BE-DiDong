const { spawn } = require("child_process");
const path = require("path");

class GameOfGoManager {
    constructor() {
        this.sessions = new Map(); // userId => { engine, sendCommand, match }
    }

    async createMatch(userId, difficulty, playerColor, boardSize = 19) {
        console.log(`🚀 [${userId}] Bắt đầu tạo phiên AI...`);

        const gtpPath = path.join(__dirname, "../go/gtp/gtp.js");
        console.log(`📁 Đường dẫn GTP: ${gtpPath}`);

        const engine = spawn("node", [gtpPath]);
        const buffer = { data: "" };
        const callbacks = [];

        engine.stdout.on("data", (data) => {
            const output = data.toString();
            buffer.data += output;
            console.log(`📥 [${userId}] Output từ engine: ${output.trim()}`);

            if (output.includes("\n\n") || output.includes("\n=")) {
                const response = buffer.data.trim();
                buffer.data = "";
                const callback = callbacks.shift();
                if (callback) {
                    console.log(`✅ [${userId}] Phản hồi hoàn tất: ${response}`);
                    callback(response);
                }
            }
        });

        engine.stderr.on("data", (data) => {
            console.error(`❌ [${userId}] Engine stderr: ${data}`);
        });

        engine.on("close", (code) => {
            console.log(`❌ [${userId}] Engine exited with code ${code}`);
            this.sessions.delete(userId);
        });

        const sendCommand = (cmd) => {
            return new Promise((resolve, reject) => {
                if (!engine) return reject("❌ Engine chưa khởi động");
                console.log(`📤 [${userId}] Gửi lệnh: ${cmd}`);
                callbacks.push(resolve);
                engine.stdin.write(`${cmd}\n`);
            });
        };

        console.log(`🔧 [${userId}] Thiết lập bàn cờ: boardsize = ${boardSize}`);
        await sendCommand(`boardsize ${boardSize}`);

        console.log(`🧼 [${userId}] Xóa bàn cờ`);
        await sendCommand("clear_board");

        const matchData = {
            difficulty,
            playerColor,
            boardSize,
            history: [],
        };

        if (playerColor === "W") {
            console.log(`🎮 [${userId}] Người chơi là trắng => AI (đen) đi trước...`);
            const aiMove = await sendCommand("genmove B");
            matchData.history.push({ player: "AI", move: aiMove.trim() });
            console.log(`🤖 [${userId}] AI (B) mở màn với: ${aiMove}`);
        }

        this.sessions.set(userId, {
            engine,
            sendCommand,
            match: matchData,
        });

        console.log(`✅ [${userId}] Đã tạo phiên thành công`);
    }

    getSession(userId) {
        console.log(`🔍 [${userId}] Truy vấn phiên hiện tại...`);
        return this.sessions.get(userId);
    }

    async stopMatch(userId) {
        console.log(`🛑 [${userId}] Yêu cầu dừng phiên...`);
        const session = this.sessions.get(userId);
        if (!session) {
            console.log(`⚠️ [${userId}] Không tìm thấy phiên`);
            return false;
        }
        session.engine.kill();
        this.sessions.delete(userId);
        console.log(`🛑 [${userId}] Đã dừng engine thành công`);
        return true;
    }
}

module.exports = new GameOfGoManager();
