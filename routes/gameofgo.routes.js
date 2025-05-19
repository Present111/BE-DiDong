const express = require("express");
const router = express.Router();
const GameOfGoManager = require("../services/GameOfGoManager");

/**
 * @swagger
 * tags:
 *   name: GameOfGo
 *   description: API đấu với AI (1 user = 1 engine)
 */

/**
 * @swagger
 * /api/gameofgo/start-ai-match:
 *   post:
 *     summary: Tạo phiên chơi AI riêng cho mỗi user
 *     tags: [GameOfGo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user123"
 *               difficulty:
 *                 type: string
 *                 enum: [easy, normal, hard]
 *                 example: normal
 *               playerColor:
 *                 type: string
 *                 enum: [B, W]
 *                 example: B
 *               boardSize:
 *                 type: integer
 *                 example: 19
 *     responses:
 *       200:
 *         description: Tạo thành công phiên chơi AI
 */
router.post("/start-ai-match", async (req, res) => {
    const { userId, difficulty = "normal", playerColor = "B", boardSize = 19 } = req.body;
    console.log("🎮 [START MATCH] Yêu cầu tạo phiên AI:", req.body);

    if (!userId) {
        console.log("❌ Thiếu userId");
        return res.status(400).send("❌ Thiếu userId");
    }

    if (!["B", "W"].includes(playerColor)) {
        console.log("❌ Quân chơi không hợp lệ:", playerColor);
        return res.status(400).send("❌ Quân chơi không hợp lệ");
    }

    try {
        console.log("⏳ Đang khởi tạo phiên đấu AI...");
        await GameOfGoManager.createMatch(userId, difficulty, playerColor, boardSize);
        const session = GameOfGoManager.getSession(userId);

        // Nếu người chơi là Trắng -> AI (Đen) đi trước
        if (playerColor === "W") {
            console.log("🤖 Người chơi là Trắng, AI (Đen) sẽ đi trước...");
                const timeout = setTimeout(() => {
        console.error("⏱ Quá thời gian chờ AI phản hồi (genmove B)");
    },3000); // 5 giây
            const aiMove = await session.sendCommand(`genmove B`);
            session.match.history.push({ player: "B", move: aiMove.trim() });
            console.log("✅ AI (Đen) đi nước đầu tiên:", aiMove.trim());
        }

        console.log(`✅ Đã tạo phiên AI cho user ${userId}`);
        res.send(`✅ Đã bắt đầu phiên chơi AI cho user ${userId}`);
    } catch (err) {
        console.error("❌ Lỗi khi tạo phiên AI:", err);
        res.status(500).send("❌ Lỗi khi tạo phiên chơi AI");
    }
});


/**
 * @swagger
 * /api/gameofgo/play-ai:
 *   post:
 *     summary: Người chơi đi và AI phản đòn
 *     tags: [GameOfGo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user123"
 *               move:
 *                 type: string
 *                 example: D4
 *     responses:
 *       200:
 *         description: Trả về nước đi của AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playerMove:
 *                   type: string
 *                 aiMove:
 *                   type: string
 */
router.post("/play-ai", async (req, res) => {
    const { userId, move } = req.body;
    console.log("🧠 [PLAYER MOVE] userId:", userId, "| move:", move);

    const session = GameOfGoManager.getSession(userId);

    if (!session) {
        console.log("❌ Không tìm thấy phiên cho user:", userId);
        return res.status(404).send("❌ Chưa có phiên chơi");
    }

    const { sendCommand, match } = session;
    const playerColor = match.playerColor;
    const aiColor = playerColor === "B" ? "W" : "B";

    try {
        console.log(`🎯 Người chơi (${playerColor}) đánh: ${move}`);
        await sendCommand(`play ${playerColor} ${move}`);
        match.history.push({ player: playerColor, move });

        console.log(`🤖 AI (${aiColor}) đang suy nghĩ...`);
        const aiMove = await sendCommand(`genmove ${aiColor}`);
        console.log(`🤖 AI đánh: ${aiMove.trim()}`);
        match.history.push({ player: aiColor, move: aiMove });

        res.json({ playerMove: move, aiMove: aiMove.trim() });
    } catch (err) {
        console.error("❌ Lỗi khi xử lý nước đi:", err);
        res.status(500).send("❌ Lỗi khi xử lý nước đi AI");
    }
});

/**
 * @swagger
 * /api/gameofgo/stop-ai:
 *   post:
 *     summary: Tắt engine của user (kết thúc phiên)
 *     tags: [GameOfGo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user123"
 *     responses:
 *       200:
 *         description: Tắt thành công engine
 *       404:
 *         description: Không tìm thấy engine
 */
router.post("/stop-ai", async (req, res) => {
    const { userId } = req.body;
    console.log("🛑 [STOP MATCH] userId:", userId);
    const stopped = await GameOfGoManager.stopMatch(userId);

    if (stopped) {
        console.log("🛑 Đã dừng phiên AI cho:", userId);
        return res.send("🛑 Đã dừng engine thành công");
    } else {
        console.log("❌ Không tìm thấy phiên để dừng:", userId);
        return res.status(404).send("❌ Không tìm thấy phiên để dừng");
    }
});

module.exports = router;
