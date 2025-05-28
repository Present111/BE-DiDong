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
  const {
    userId,
    difficulty = "normal",
    playerColor = "B",
    boardSize = 19,
  } = req.body;
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
    await GameOfGoManager.createMatch(
      userId,
      difficulty,
      playerColor,
      boardSize
    );
    const session = GameOfGoManager.getSession(userId);

    let aiMoveFirst = null;

    if (playerColor === "W") {
      console.log("🤖 Người chơi là Trắng, AI (Đen) sẽ đi trước...");

      const aiMove = await Promise.race([
        session.sendCommand(`genmove B`),
        new Promise((_, reject) =>
          setTimeout(() => reject("⏱ Timeout genmove B"), 5000)
        ),
      ]);

      aiMoveFirst =
        aiMove
          .split("\n")
          .map((line) => line.replace(/^=\s*/, ""))
          .find((line) => /^[A-T][0-9]{1,2}$/i.test(line)) || "PASS";

      session.match.history.push({ player: "B", move: aiMoveFirst });

      console.log("✅ AI (Đen) đi nước đầu tiên:", aiMoveFirst);
    }

    console.log(`✅ Đã tạo phiên AI cho user ${userId}`);
    res.json({
      message: `✅ Đã bắt đầu phiên chơi AI cho user ${userId}`,
      aiMove: aiMoveFirst,
    });
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
    const aiMoveRaw = await sendCommand(`genmove ${aiColor}`);
    const aiMoveCleaned =
      aiMoveRaw
        .split("\n")
        .map((line) => line.replace(/^=\s*/, ""))
        .find((line) => /^[A-T][0-9]{1,2}$/i.test(line)) || "PASS";

    console.log(`🤖 AI đánh: ${aiMoveCleaned}`);
    match.history.push({ player: aiColor, move: aiMoveCleaned });

    res.json({ playerMove: move, aiMove: aiMoveCleaned });
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
