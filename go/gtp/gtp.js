import * as tf from "../js/tensorflow.js";
import fetch from "node-fetch";
globalThis.fetch = fetch;
export default tf;

import readline from "readline";
import goban from "../js/goban.js";
const {
  BLACK,
  WHITE,
  size,
  getHistory,
  initGoban,
  printBoard,
  setStone,
  playMove,
  passMove,
} = goban;

// Đảm bảo model đã sẵn sàng trước khi làm bất cứ điều gì!
await goban.initModels(); // <--- CHỜ CHẮC CHẮN XONG!

const DIFFICULTY = process.argv[2] || "normal";

var gtp = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

gtp.on("line", async function (command) {
  if (command == "quit") {
    process.exit();
  } else if (command.includes("name")) {
    setTimeout(function () {
      console.log("= PWAGoBot\n");
    }, 5000);
  } else if (command.includes("protocol_version")) {
    console.log("= 2\n");
  } else if (command.includes("version")) {
    console.log("= 1.0\n");
  } else if (command.includes("list_commands")) {
    console.log("= protocol_version\nclear_board\n");
  } else if (command.includes("boardsize")) {
    console.log("=\n");
  } else if (command.includes("clear_board")) {
    initGoban();
    console.log("=\n");
  } else if (command.includes("showboard")) {
    console.log("= ");
    printBoard();
  } else if (command.includes("play")) {
    let color = command.split(" ")[1].toLowerCase() == "b" ? BLACK : WHITE;
    let coord = command.split(" ")[2].toLowerCase();
    if (coord == "pass") {
      passMove();
    } else {
      let col = " abcdefghjklmnopqrst".indexOf(coord[0]);
      let row = size - parseInt(coord.slice(1)) - 1;
      let sq = row * size + col;
      setStone(sq, color);
    }
    console.log("=\n");
  } else if (command.includes("genmove")) {
    try {
      let aiMove = await playMove();
      if (aiMove.toUpperCase() === "PASS") {
        console.warn("[Override] PASS bị chặn, trả về D10 thay thế");
        aiMove = "D10";
      }
      console.log(`= ${aiMove}\n`);
    } catch (e) {
      console.error("[ERROR] Không thể lấy nước đi AI:", e);
      console.log("= D10\n");
    }
  } else {
    console.log("=\n");
  }
});

initGoban();
if (DIFFICULTY === "easy") global.level = 0; // đánh ngu (random rộng)
else if (DIFFICULTY === "normal") global.level = 1; // đánh bình thường
else if (DIFFICULTY === "hard") global.level = 2; // dùng model dan
