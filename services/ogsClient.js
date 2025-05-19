const axios = require("axios");
const qs = require("qs"); // Dùng để encode body dạng form

const BASE_URL = "https://online-go.com/api/v1";
let accessToken = "";

async function getAccessToken(clientId, clientSecret) {
  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const res = await axios.post("https://online-go.com/oauth2/token/", data, { headers });
  accessToken = res.data.access_token;
  return accessToken;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };
}

async function createAIGame({ boardSize = 19, playerColor = "black", botId = 109 }) {
  const body = {
    challenger_color: playerColor,
    initial_player: "you",
    bot_id: botId,
    game: {
      name: "Match vs AI",
      rules: "japanese",
      ranked: false,
      handicap: 0,
      komi: 6.5,
      board_size: boardSize,
      time_control: "fischer",
      time_control_parameters: {
        time_increment: 10,
        main_time: 300,
        max_time: 600
      }
    }
  };

  const res = await axios.post(`${BASE_URL}/challenges/`, body, {
    headers: getHeaders()
  });
  return res.data;
}

module.exports = {
  getAccessToken,
  createAIGame
};
