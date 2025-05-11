// routes/gameofgo.routes.js
const express = require("express");
const router = express.Router();
const GameOfGoService = require("../services/GameOfGoService");

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
 *     summary: Gửi lệnh play + genmove cho Game Of Go bot
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
router.post("/play", async (req, res) => {
    const { move } = req.body;
    if (!move) return res.status(400).send("Thiếu tham số move");

    try {
        const response = await GameOfGoService.playMove(move);
        res.send({ result: response });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi gửi lệnh đến Game Of Go");
    }
});

module.exports = router;
