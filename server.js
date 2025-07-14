const { WebSocketServer } = require("ws");
const { v4: uuid } = require("uuid");
const winston = require("winston");

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: winston.format.printf(
        ({ level, trace, message }) =>
          `${level.toUpperCase().padEnd(4, " ")} | ${trace ? trace.substring(0, 5) : " ".repeat(5)} > ${message}`,
      ),
    }),
  ],
});
const port = 3001;
const games = {};
const wss = new WebSocketServer({
  port,
});

wss.on("connection", function connection(ws, req) {
  clearGamesOlderThan24h();
  ws.id = uuid();
  ws.logger = logger.child({
    trace: ws.id,
    layer: "ws",
  });
  ws.gameId =
    +new URL("http://host" + req.url).searchParams.get("id") ||
    Math.floor(Math.random() * 10000);
  ws.logger.info(`Game: ${ws.gameId} > new player.`);
  ws.on("message", function message(rawData) {
    try {
      const data = JSON.parse(rawData);
      if (data.action === "article") {
        games[ws.gameId] = games[ws.gameId] || {
          picked: false,
          articles: [],
          timestamp: new Date(),
        };
        games[ws.gameId].articles.push(data.payload);

        sendForWholeGame(
          ws.gameId,
          JSON.stringify({
            action: "update",
            payload: {
              picked: games[ws.gameId].picked,
              articlesCount: games[ws.gameId].articles.length,
            },
          }),
        );
      }
      if (data.action === "pick" && games[ws.gameId]?.articles?.length >= 1) {
        games[ws.gameId].picked =
          games[ws.gameId].articles[
            Math.floor(Math.random() * games[ws.gameId].articles.length)
          ];
        sendForWholeGame(
          ws.gameId,
          JSON.stringify({
            action: "update",
            payload: {
              picked: games[ws.gameId].picked,
            },
          }),
        );
      }
      if (data.action === "clear") {
        delete games[ws.gameId];
        wss.clients.forEach((client) => {
          if (client.gameId === ws.gameId) {
            client.send(
              JSON.stringify({
                action: "update",
                payload: {
                  picked: false,
                  articlesCount: 0,
                },
              }),
            );
          }
        });
      }
    } catch (e) {
      ws.logger.warn(
        `[${ws.id}] Could not handle message - ${rawData.toString()}`,
      );
    }
  });
  ws.on("close", function () {
    ws.logger.info(`Game: ${ws.gameId} > player disconnected.`);
  });
  sendForWholeGame(
    ws.gameId,
    JSON.stringify({
      action: "update",
      payload: {
        gameId: ws.gameId,
        picked: games[ws.gameId]?.picked ?? false,
        articlesCount: games[ws.gameId]?.articles.length,
        playersCount: Array.from(wss.clients).filter(
          (client) => client.gameId === ws.gameId,
        ).length,
      },
    }),
  );
});

logger.info(`Sockets server started on :${port}.`);

function clearGamesOlderThan24h() {
  const now = new Date();
  const h24 = 1000 * 60 * 60 * 24;
  Object.entries(games).forEach(([id, game]) => {
    if (game.timestamp - now > h24) {
      delete games[id];
    }
  });
}

function sendForWholeGame(gameId, message) {
  wss.clients.forEach((client) => {
    if (client.gameId === gameId) {
      client.send(message);
    }
  });
}
