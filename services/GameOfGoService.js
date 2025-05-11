// services/GameOfGoService.js
const { spawn } = require("child_process");
const path = require("path");

class GameOfGoService {
    constructor() {
        this.engine = null;
        this.buffer = "";
        this.callbacks = [];
    }

    init() {
        const gtpPath = path.join(__dirname, "../go/gtp/gtp.js");
        this.engine = spawn("node", [gtpPath]);

        console.log("✅ Game Of Go bot started!");

        this.engine.stdout.on("data", (data) => {
            const output = data.toString();
            this.buffer += output;

            // Kiểm tra kết thúc của response
            if (output.includes("\n\n") || output.includes("\n=")) {
                const response = this.buffer.trim();
                this.buffer = "";

                const callback = this.callbacks.shift();
                if (callback) callback(response);
            }
        });

        this.engine.stderr.on("data", (data) => {
            console.error(`❌ GameOfGo Error: ${data}`);
        });

        this.engine.on("close", (code) => {
            console.log(`❌ GameOfGo exited with code ${code}`);
        });
    }

    sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.engine) return reject("Engine chưa khởi động");
            this.callbacks.push(resolve);
            this.engine.stdin.write(`${command}\n`);
        });
    }

    async playMove(move) {
        await this.sendCommand(`play B ${move}`);
        const result = await this.sendCommand(`genmove W`);
        return result;
    }

    stopEngine() {
        if (this.engine) this.engine.kill();
    }
}

module.exports = new GameOfGoService();
