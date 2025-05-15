const GameOfGoService = require('../services/GameOfGoService');

exports.playMove = async (req, res) => {
    const { move } = req.body;
    if (!move) return res.status(400).send("Thiếu tham số move");

    try {
        // Người chơi đi quân đen
        await GameOfGoService.sendCommand(`play B ${move}`);

        // Bot đánh trả quân trắng
        const botMove = await GameOfGoService.sendCommand('genmove W');

        res.send({
            playerMove: move,
            botMove: botMove.trim()    // loại bỏ khoảng trắng thừa
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi gửi lệnh đến Game Of Go");
    }
};
