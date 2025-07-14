import QRCode from "qrcode";
import "./main.scss";

const gameIdRef = document.getElementById("game-id");
const articlesCountRef = document.getElementById("articles-count");
const playersCountRef = document.getElementById("players-count");
const articleBoxRef = document.getElementById("article");
const pickedBoxRef = document.getElementById("picked");
const qrCodeRef = document.getElementById("qr-code");
const popupRef = document.getElementById("popup");

window.addArticle = addArticle;
window.handleEnter = handleEnter;
window.pickArticle = pickArticle;
window.clearArticles = clearArticles;
window.updatePopup = updatePopup;
window.copyLink = copyLink;
window.shareLink = shareLink;
if (!navigator.share) {
  document.getElementById("share-link-btn").style.display = "none";
}

const gameId = new URLSearchParams(document.location.search).get("id");
if (gameId) {
  gameIdRef.innerText = gameId;
}
const protocol = document.location.protocol.startsWith("https") ? "wss" : "ws";
const ws = new WebSocket(
  `${protocol}://${document.location.host}${document.location.pathname}/ws?id=${gameId}`,
);
ws.addEventListener("message", (msg) => {
  const data = JSON.parse(msg.data);
  if (data.action === "update") {
    if (data.payload.gameId) {
      window.history.replaceState(
        {},
        "",
        `${window.location.hash}${window.location.pathname}?id=${data.payload.gameId}`,
      );
      updateQRCode();
    }
    updateText(gameIdRef, data.payload.gameId);
    updateText(articlesCountRef, data.payload.articlesCount);
    updateText(playersCountRef, data.payload.playersCount);
    if (data.payload.picked) {
      updatePopup("picked");
    } else if (new URLSearchParams(window.location.search).get("popup")) {
      updatePopup(false);
    }
    updateText(pickedBoxRef, data.payload.picked);
  }
});

window.addEventListener("popstate", () => {
  if (popupRef.className !== "popup") {
    popupRef.className = "popup";

    if (pickedBoxRef.innerText) {
      clearArticles();
    }
  }
});

function updateText(ref, text) {
  if (ref.textContent !== text && text !== undefined) {
    if (text === false) {
      ref.textContent = "";
      return;
    }
    ref.textContent = text?.toString();
  }
}

function updateQRCode() {
  QRCode.toCanvas(
    qrCodeRef,
    `${document.location.protocol}://${document.location.host}${document.location.pathname}?id=${new URLSearchParams(document.location.search).get("id")}`,
    {
      color: {
        dark: "#FFFFFF",
        light: "#000000",
      },
      margin: 1,
    },
    (err) => {
      if (err) {
        console.error(err.message);
      }
    },
  );
}

function updatePopup(action) {
  if (!action) {
    window.history.back();
    return;
  }

  popupRef.classList.add(action);
  const newUrl = new URL(window.location);
  newUrl.searchParams.set("popup", true);
  window.history.pushState({}, "", newUrl.toString());
}

function addArticle() {
  const article = articleBoxRef.value.trim();

  if (!article) {
    return;
  }

  articleBoxRef.value = "";
  ws.send(
    JSON.stringify({
      action: "article",
      payload: article,
    }),
  );
}

function handleEnter(e) {
  if (e.key === "Enter") {
    addArticle();
  }
}

function pickArticle() {
  ws.send(
    JSON.stringify({
      action: "pick",
    }),
  );
}

function clearArticles() {
  ws.send(
    JSON.stringify({
      action: "clear",
    }),
  );
}

function copyLink() {
  navigator.clipboard?.writeText &&
    navigator.clipboard.writeText(
      `${document.location.protocol}//${document.location.host}${document.location.pathname}?id=${new URLSearchParams(document.location.search).get("id")}`,
    );
}

function shareLink() {
  navigator.share &&
    navigator.share({
      title: `Two of those people are lying - game ${gameId}`,
      url: `${document.location.pathname}?id=${new URLSearchParams(document.location.search).get("id")}`,
    });
}
