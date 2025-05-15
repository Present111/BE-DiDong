const express = require("express");
const router = express.Router();
const GameOfGoService = require("../services/GameOfGoService");
const GameOfGoController = require("../controllers/GameOfGoController");

/**
 * @swagger
 * tags:
 *   name: GameOfGo
 *   description: API điều khiển Game Of Go Bot
 */

/**
 * @swagger
 * /api/gameofgo/play:
 *   post:
 *     summary: Người chơi đi + bot đánh trả
 *     tags: [GameOfGo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               move:
 *                 type: string
 *                 example: D4
 *     responses:
 *       200:
 *         description: Kết quả trả về từ Game Of Go bot
 */
router.post("/play", GameOfGoController.playMove);

/**
 * @swagger
 * /api/gameofgo/setup:
 *   post:
 *     summary: Thiết lập bàn cờ với kích thước (9, 13, 19)
 *     tags: [GameOfGo]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: integer
 *                 example: 13
 *     responses:
 *       200:
 *         description: Đã thiết lập bàn cờ
 */
router.post("/setup", async (req, res) => {
    const { size = 13 } = req.body;

    try {
        await GameOfGoService.setupBoard(size);
        res.send(`✅ Đã thiết lập bàn cờ ${size}x${size}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi setup bàn cờ");
    }
});

module.exports = router;
