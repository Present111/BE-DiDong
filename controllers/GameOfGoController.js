// controllers/GameOfGoController.js
const GameOfGoService = require('../services/GameOfGoService');

exports.playMove = (req, res) => {
    const { move } = req.body;
    if (!move) return res.status(400).send("Missing move");

    GameOfGoService.sendCommand(`play B ${move}`);    // ví dụ: D4
    GameOfGoService.sendCommand('genmove W');

    res.send(`Sent move ${move} to GameOfGo`);
};
