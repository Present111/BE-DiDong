// routes/chatMessage.routes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatMessage.controller");

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat message management
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   post:
 *     summary: Create or get conversation between two users
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user1:
 *                 type: string
 *               user2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation found or created
 */
router.post("/conversations", chatController.createConversation);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send message in a conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post("/conversations/:conversationId/messages", chatController.sendMessage);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation details
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation data
 */
router.get("/conversations/:conversationId", chatController.getConversation);

/**
 * @swagger
 * /api/chat/users/{userId}/conversations:
 *   get:
 *     summary: Get all conversations of a user
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get("/users/:userId/conversations", chatController.getConversationsByUser);


/**
 * @swagger
 * /api/chat/users/{userId}/conversations:
 *   get:
 *     summary: Get all conversations of a user with last message, unread count, and isYou
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   conversationId:
 *                     type: string
 *                   friend:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       avatarUrl:
 *                         type: string
 *                   lastMessage:
 *                     type: string
 *                   lastMessageTime:
 *                     type: string
 *                     format: date-time
 *                   unreadCount:
 *                     type: integer
 *                   isYou:
 *                     type: boolean
 */
router.get("/users/:userId/conversations", chatController.getConversationsByUser);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/mark-read/{userId}:
 *   put:
 *     summary: Đánh dấu tất cả tin nhắn là đã đọc cho user
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tin nhắn đã được đánh dấu là đã đọc
 */
router.put("/conversations/:conversationId/mark-read/:userId", chatController.markAllMessagesRead);



/**
 * @swagger
 * /api/conversations/unread-count/{userId}:
 *   get:
 *     summary: Get number of conversations with unread messages
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Number of unread conversations
 */
router.get('/conversations/unread-count/:userId', chatController.getUnreadConversationCount);
module.exports = router;
