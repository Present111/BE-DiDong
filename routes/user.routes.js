// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management + Friends + Challenges
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     summary: Get users sorted by elo descending
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Sorted list of users by elo
 */
router.get("/leaderboard", userController.getUsersByElo);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register user (normal or Google)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               googleId:
 *                 type: string
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Register successful or Login by Google successful
 */
router.post("/register", userController.registerUser);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/", userController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", userController.getAllUsers);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users not yet friends or requested
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users matching query
 */
router.get("/search", userController.searchUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 */
router.get("/:id", userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 */
router.put("/:id", userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/:id", userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/friends:
 *   post:
 *     summary: Send friend request
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               friendId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request sent
 */
router.post("/:id/friends", userController.addFriend);

/**
 * @swagger
 * /api/users/{id}/friends:
 *   patch:
 *     summary: Update friend status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               friendId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [friend, request, removed]
 *     responses:
 *       200:
 *         description: Friend status updated
 */
router.patch("/:id/friends", userController.updateFriendStatus);

/**
 * @swagger
 * /api/users/{userId}/challenges/send:
 *   post:
 *     summary: Send challenge to another user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               challengerId:
 *                 type: string
 *               receiverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Challenge sent
 */
router.post("/:userId/challenges/send", userController.sendChallenge);

/**
 * @swagger
 * /api/users/{userId}/challenges/{challengeId}/accept:
 *   patch:
 *     summary: Accept a challenge
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge accepted
 */
router.patch(
  "/:userId/challenges/:challengeId/accept",
  userController.acceptChallenge
);

/**
 * @swagger
 * /api/users/{userId}/challenges/{challengeId}/decline:
 *   patch:
 *     summary: Decline a challenge
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge declined
 */
router.patch(
  "/:userId/challenges/:challengeId/decline",
  userController.declineChallenge
);

/**
 * @swagger
 * /api/users/{receiverId}/challenges/{challengeId}/cancel:
 *   patch:
 *     summary: Cancel a challenge
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge cancelled
 */
router.patch(
  "/:receiverId/challenges/:challengeId/cancel",
  userController.cancelChallenge
);

router.post(
  "/request-change-password",
  userController.requestChangePasswordCode
);
router.post("/confirm-change-password", userController.confirmChangePassword);

/**
 * @swagger
 * /api/users/friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromUserId:
 *                 type: string
 *               toUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request sent
 */
router.post("/friends/request", userController.sendFriendRequest);

/**
 * @swagger
 * /api/users/friends/respond:
 *   post:
 *     summary: Respond to a friend request (accept or reject)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromUserId:
 *                 type: string
 *               toUserId:
 *                 type: string
 *               accepted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Friend request responded
 */
router.post("/friends/respond", userController.respondToFriendRequest);

/**
 * @swagger
 * /api/users/{userId}/friends/requests:
 *   get:
 *     summary: Get friend requests received by user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of friend requests
 */
router.get("/:userId/friends/requests", userController.getFriendRequests);

/**
 * @swagger
 * /api/users/{userId}/unfriend/{friendId}:
 *   delete:
 *     summary: Unfriend another user (2-way removal)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfriended successfully
 */
router.delete("/:userId/unfriend/:friendId", userController.unfriendUser);

module.exports = router;
