// ========================================
// Notification API デモアプリ
// ========================================

/**
 * ログエントリを追加する関数
 * @param {string} message - ログメッセージ
 * @param {string} type - ログタイプ（info, success, warning, error）
 */
function addLog(message, type = "info") {
  const logContainer = document.getElementById("log-container");
  const empty = logContainer.querySelector(".log-empty");
  if (empty) {
    empty.remove();
  }

  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${type}`;

  const timestamp = new Date().toLocaleTimeString("ja-JP");
  logEntry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        <span class="log-message">${message}</span>
    `;

  logContainer.insertBefore(logEntry, logContainer.firstChild);

  // サーバーにログを送信（オプション）
  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, type, timestamp }),
  }).catch(() => {
    // エラーは無視（ログ送信は重要でない）
  });
}

/**
 * 許可ステータスを更新する関数
 */
function updatePermissionStatus() {
  const statusElement = document.getElementById("permission-status");
  const permission = Notification.permission;

  statusElement.textContent =
    {
      granted: "✅ 許可済み",
      denied: "❌ 拒否",
      default: "⚠️ 未設定",
    }[permission] || permission;

  statusElement.className = `status-badge ${permission}`;

  addLog(`通知の許可状態: ${permission}`, "info");
}

/**
 * 通知オブジェクトにイベントリスナーを登録する関数
 * @param {Notification} notification - 通知オブジェクト
 */
function attachNotificationListeners(notification) {
  notification.onshow = function () {
    addLog(`📢 通知が表示されました: "${this.title}"`, "success");
  };

  notification.onclick = function () {
    addLog(`👆 通知がクリックされました: "${this.title}"`, "info");
    window.focus();
    this.close();
  };

  notification.onclose = function () {
    addLog(`❌ 通知が閉じられました: "${this.title}"`, "info");
  };

  notification.onerror = function () {
    addLog(`⚠️ 通知でエラーが発生しました: "${this.title}"`, "error");
  };
}

/**
 * 基本的な通知を送信する関数
 * @param {string} title - 通知のタイトル
 * @param {string} body - 通知の本文
 */
function sendBasicNotification(title, body) {
  if (Notification.permission !== "granted") {
    addLog("⚠️ 通知の許可が必要です", "warning");
    return;
  }

  try {
    const notification = new Notification(title, { body });
    // attachNotificationListeners(notification);
    addLog(`✉️ 基本通知を送信: "${title}"`, "success");
  } catch (error) {
    addLog(`❌ 通知の送信に失敗: ${error.message}`, "error");
  }
}

/**
 * リッチ通知を送信する関数
 * @param {string} title - 通知のタイトル
 * @param {Object} options - 通知のオプション
 */
function sendRichNotification(title, options) {
  if (Notification.permission !== "granted") {
    addLog("⚠️ 通知の許可が必要です", "warning");
    return;
  }

  try {
    const notification = new Notification(title, options);
    attachNotificationListeners(notification);
    addLog(`✨ リッチ通知を送信: "${title}"`, "success");
    console.log("通知オプション:", options);
  } catch (error) {
    addLog(`❌ 通知の送信に失敗: ${error.message}`, "error");
  }
}

/**
 * プリセット通知を送信する関数
 * @param {string} type - プリセットタイプ
 */
function sendPresetNotification(type) {
  if (Notification.permission !== "granted") {
    addLog("⚠️ 通知の許可が必要です", "warning");
    return;
  }

  const presets = {
    success: {
      title: "✅ 処理が完了しました",
      options: {
        body: "操作が正常に完了しました。",
        icon: "/assets/icon.png",
        tag: "success",
      },
    },
    warning: {
      title: "⚠️ 警告",
      options: {
        body: "注意が必要な状況が発生しました。",
        icon: "/assets/icon.png",
        tag: "warning",
      },
    },
    error: {
      title: "❌ エラーが発生しました",
      options: {
        body: "処理中にエラーが発生しました。",
        icon: "/assets/icon.png",
        tag: "error",
        requireInteraction: true,
      },
    },
    info: {
      title: "ℹ️ お知らせ",
      options: {
        body: "新しい情報があります。",
        icon: "/assets/icon.png",
        tag: "info",
      },
    },
  };

  const preset = presets[type];
  if (preset) {
    sendRichNotification(preset.title, preset.options);
  }
}

// ========================================
// 初期化処理
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // ブラウザがNotification APIをサポートしているかチェック
  if (!("Notification" in window)) {
    addLog("❌ このブラウザは通知APIをサポートしていません", "error");
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.disabled = true;
    });
    return;
  }

  addLog("🚀 Notification API デモアプリを起動しました", "success");
  updatePermissionStatus();

  // ========================================
  // イベントリスナーの設定
  // ========================================

  // 通知の許可を要求
  document
    .getElementById("request-permission")
    .addEventListener("click", async () => {
      try {
        const permission = await Notification.requestPermission();
        addLog(
          `📝 許可リクエストの結果: ${permission}`,
          permission === "granted" ? "success" : "warning"
        );
        updatePermissionStatus();
      } catch (error) {
        addLog(`❌ 許可リクエストエラー: ${error.message}`, "error");
      }
    });

  // 基本通知を送信
  document.getElementById("send-basic").addEventListener("click", () => {
    const title = document.getElementById("basic-title").value;
    const body = document.getElementById("basic-body").value;
    sendBasicNotification(title, body);
  });

  // リッチ通知を送信
  document.getElementById("send-rich").addEventListener("click", () => {
    const title = document.getElementById("rich-title").value;
    const body = document.getElementById("rich-body").value;
    const tag = document.getElementById("rich-tag").value;

    const options = {
      body: body,
    };

    // オプションの設定
    if (document.getElementById("rich-icon").checked) {
      options.icon = "/assets/icon.png";
    }
    if (document.getElementById("rich-badge").checked) {
      options.badge = "/assets/badge.png";
    }
    if (document.getElementById("rich-image").checked) {
      options.image = "/assets/icon.png"; // 画像として同じものを使用
    }
    if (document.getElementById("rich-require-interaction").checked) {
      options.requireInteraction = true;
    }
    if (document.getElementById("rich-silent").checked) {
      options.silent = true;
    }
    if (tag) {
      options.tag = tag;
    }

    sendRichNotification(title, options);
  });

  // カスタム通知を送信
  document.getElementById("send-advanced").addEventListener("click", () => {
    const vibratePattern = document.getElementById("vibrate-pattern").value;
    const direction = document.getElementById("direction").value;
    const lang = document.getElementById("lang").value;

    const options = {
      body: "カスタムオプション付きの通知です",
      icon: "/assets/icon.png",
      dir: direction,
      lang: lang,
    };

    // 振動パターンの設定
    if (vibratePattern) {
      try {
        options.vibrate = vibratePattern
          .split(",")
          .map((v) => parseInt(v.trim()));
      } catch (error) {
        addLog("⚠️ 振動パターンの形式が正しくありません", "warning");
      }
    }

    sendRichNotification("🎨 カスタム通知", options);
  });

  // プリセット通知ボタン
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", (e) => {
      const preset = e.currentTarget.dataset.preset;
      sendPresetNotification(preset);
    });
  });

  // ログをクリア
  document.getElementById("clear-log").addEventListener("click", () => {
    const logContainer = document.getElementById("log-container");
    logContainer.innerHTML =
      '<p class="log-empty">ログはここに表示されます</p>';
    addLog("🗑️ ログをクリアしました", "info");
  });

  // ========================================
  // デモ用の自動通知（5秒後）
  // ========================================
  setTimeout(() => {
    if (Notification.permission === "granted") {
      sendBasicNotification(
        "👋 ようこそ！",
        "Notification API デモアプリへようこそ。色々な通知を試してみましょう！"
      );
    }
  }, 5000);
});

// ========================================
// ページの可視性変更イベント
// ========================================
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    addLog("👁️ ページが非表示になりました", "info");
  } else {
    addLog("👁️ ページが表示されました", "info");
  }
});

// ========================================
// グローバルエラーハンドラー
// ========================================
window.addEventListener("error", (event) => {
  addLog(`⚠️ グローバルエラー: ${event.message}`, "error");
});

console.log(
  "%c🔔 Notification API デモアプリ",
  "color: #3b82f6; font-size: 20px; font-weight: bold;"
);
console.log("このアプリではブラウザのNotification APIの各機能を学習できます。");
console.log(
  "詳細: https://developer.mozilla.org/ja/docs/Web/API/Notifications_API"
);
