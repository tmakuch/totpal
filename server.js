const { WebSocketServer } = require("ws");

const port = +(process.argv[2] ?? 3001);
const games = {};
const wss = new WebSocketServer({
  port,
});

wss.on("connection", function connection(ws, req) {
  clearGamesOlderThan24h();

  ws.gameId =
    +new URL("http://host" + req.url).searchParams.get("id") ||
    Math.floor(Math.random() * 10000);
  console.log(`Game: ${ws.gameId} > player connected.`);

  ws.on("message", function message(rawData) {
    try {
      const data = JSON.parse(rawData.toString());
      switch (data.action) {
        case 'article':
          handleAddingArticle(wss, ws, data.payload);
          break;
        case 'pick':
          if (games[ws.gameId]?.articles?.length >= 1) {
            handlePickArticle(wss, ws);
          }
          break;
        case 'clear':
          handleClearArticles(wss, ws);
          break;
        default:
          console.warn('Unknown action: ' + rawData.toString());
      }
    } catch (e) {
      console.error('Could not handle message: ' + rawData.toString());
    }
  });

  ws.on("close", function () {
    console.log(`Game: ${ws.gameId} > player disconnected.`);
  });

  sendForWholeGame(
    wss,
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

console.log(`Sockets server started on :${port}.`);

function clearGamesOlderThan24h() {
  const now = new Date();
  const h24 = 1000 * 60 * 60 * 24;
  Object.entries(games).forEach(([id, game]) => {
    if (game.timestamp - now > h24) {
      delete games[id];
    }
  });
}

function sendForWholeGame(wss, gameId, message) {
  wss.clients.forEach((client) => {
    if (client.gameId === gameId) {
      client.send(message);
    }
  });
}

function handleAddingArticle(wss, ws, payload) {
  games[ws.gameId] = games[ws.gameId] || {
    picked: false,
    articles: [],
    timestamp: new Date(),
  };
  games[ws.gameId].articles.push(payload);

  sendForWholeGame(
    wss,
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

function handlePickArticle(wss, ws) {
  games[ws.gameId].picked =
    games[ws.gameId].articles[
      Math.floor(Math.random() * games[ws.gameId].articles.length)
      ];
  sendForWholeGame(
    wss,
    ws.gameId,
    JSON.stringify({
      action: "update",
      payload: {
        picked: games[ws.gameId].picked,
      },
    }),
  );
}

function handleClearArticles(wss, ws) {
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