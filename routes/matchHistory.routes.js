const express = require("express");
const router = express.Router();
const matchHistoryController = require("../controllers/matchHistory.controller");

/**
 * @swagger
 * tags:
 *   name: Match History
 *   description: API quản lý lịch sử trận đấu
 */

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Lấy danh sách tất cả trận đấu
 *     tags: [Match History]
 *     responses:
 *       200:
 *         description: Danh sách trận đấu
 */
/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Tạo mới trận đấu
 *     tags: [Match History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerBlack:
 *                 type: string
 *               playerWhite:
 *                 type: string
 *               winner:
 *                 type: string
 *                 enum: [black, white, draw]
 *               type:
 *                 type: string
 *                 enum: [ranked, friendly, bot]
 *               moves:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: number
 *                     move:
 *                       type: string
 *               resultDescription:
 *                 type: string
 *               deltaElo:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: Lấy chi tiết 1 trận đấu
 *     tags: [Match History]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trận đấu
 *     responses:
 *       200:
 *         description: Chi tiết trận đấu
 *       404:
 *         description: Không tìm thấy
 */
/**
 * @swagger
 * /api/matches/{id}:
 *   delete:
 *     summary: Xóa 1 trận đấu
 *     tags: [Match History]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trận đấu
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy
 */



/**
 * @swagger
 * /api/matches/user/{userId}:
 *   get:
 *     summary: Lấy danh sách trận đấu của user
 *     tags: [Match History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Danh sách trận đấu của user
 *       404:
 *         description: Không tìm thấy trận đấu
 */
router.get("/user/:userId", matchHistoryController.getMatchesByUserId);



// API routes
router.get("/", matchHistoryController.getAllMatches);
router.post("/", matchHistoryController.createMatch);
router.get("/:id", matchHistoryController.getMatchById);
router.delete("/:id", matchHistoryController.deleteMatch);



module.exports = router;
