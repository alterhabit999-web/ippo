import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

// ===== Service Worker 登録（PWA対応）=====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(process.env.PUBLIC_URL + "/sw.js")
      .then((reg) => {
        console.log("SW registered:", reg.scope);

        // 新しいバージョンが見つかったとき
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // 新しいバージョンの準備完了 → 更新バナーを表示
              showUpdateBanner(newWorker);
            }
          });
        });
      })
      .catch((err) => console.log("SW registration failed:", err));

    // SWが切り替わったらページをリロード（最新バージョンを確実に反映）
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// 「新しいバージョンがあります」バナーを画面上部に表示する
function showUpdateBanner(newWorker) {
  // すでにバナーがある場合は表示しない
  if (document.getElementById("ippo-update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "ippo-update-banner";
  banner.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "right: 0",
    "background: #D45F10",
    "color: white",
    "text-align: center",
    "padding: 12px 16px",
    "z-index: 99999",
    "font-size: 14px",
    "font-family: sans-serif",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "gap: 12px",
  ].join(";");

  banner.innerHTML = `
    <span>🆕 新しいバージョンがあります</span>
    <button
      id="ippo-update-btn"
      style="background:white;color:#D45F10;border:none;padding:5px 14px;border-radius:14px;font-weight:bold;font-size:13px;cursor:pointer;"
    >今すぐ更新</button>
  `;

  document.body.appendChild(banner);

  document.getElementById("ippo-update-btn").addEventListener("click", () => {
    // SWに「今すぐ切り替えて」と伝える
    newWorker.postMessage("SKIP_WAITING");
    banner.remove();
  });
}
