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
    attachNotificationListeners(notification);
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
// Push API 関連のグローバル変数
// ========================================
let swRegistration = null;
let pushSubscription = null;

// ========================================
// Push API ユーティリティ関数
// ========================================

/**
 * Unit8Arrayを Base64 に変換
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * プッシュ購読状態を更新
 */
function updatePushStatus(status, message) {
  const statusElement = document.getElementById("push-status");
  const infoElement = document.getElementById("push-info-text");

  const statusConfig = {
    unregistered: {
      text: "SW未登録",
      class: "default",
      info: "Service Workerを登録してください",
    },
    registered: {
      text: "SW登録済",
      class: "default",
      info: "プッシュ通知を購読できます",
    },
    subscribed: {
      text: "✅ 購読中",
      class: "granted",
      info: "プッシュ通知を受信できます",
    },
    unsubscribed: {
      text: "未購読",
      class: "default",
      info: "プッシュ通知を購読してください",
    },
  };

  const config = statusConfig[status] || statusConfig.unregistered;
  statusElement.textContent = config.text;
  statusElement.className = `status-badge ${config.class}`;
  infoElement.textContent = message || config.info;
}

/**
 * ボタンの状態を更新
 */
function updatePushButtons(swRegistered, isSubscribed) {
  document.getElementById("register-sw").disabled = swRegistered;
  document.getElementById("subscribe-push").disabled =
    !swRegistered || isSubscribed;
  document.getElementById("unsubscribe-push").disabled = !isSubscribed;
}

/**
 * Service Worker を登録
 */
async function registerServiceWorker() {
  try {
    addLog("🔄 Service Workerを登録中...", "info");

    const registration = await navigator.serviceWorker.register("/sw.js");
    swRegistration = registration;

    addLog("✅ Service Workerの登録に成功しました", "success");
    console.log("Service Worker registered:", registration);

    updatePushStatus("registered");
    updatePushButtons(true, false);

    return registration;
  } catch (error) {
    addLog(`❌ Service Worker登録エラー: ${error.message}`, "error");
    throw error;
  }
}

/**
 * プッシュ通知を購読
 */
async function subscribePush() {
  try {
    if (!swRegistration) {
      throw new Error("Service Workerが登録されていません");
    }

    addLog("🔄 プッシュ通知を購読中...", "info");

    // サーバーからVAPID公開鍵を取得
    const response = await fetch("/api/push/vapid-public-key");
    const { publicKey } = await response.json();

    addLog(`📝 VAPID公開鍵を取得しました`, "info");

    // PushManager.subscribe() を呼び出して購読
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true, // ユーザーに見える通知のみ
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    pushSubscription = subscription;

    addLog("✅ プッシュ通知の購読に成功しました", "success");
    console.log("Push Subscription:", JSON.stringify(subscription));

    // サーバーに購読情報を送信
    const subResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    const result = await subResponse.json();
    addLog(
      `📤 購読情報をサーバーに送信しました (購読者数: ${result.totalSubscriptions})`,
      "success"
    );

    updatePushStatus(
      "subscribed",
      `エンドポイント: ${subscription.endpoint.substring(0, 50)}...`
    );
    updatePushButtons(true, true);
  } catch (error) {
    addLog(`❌ プッシュ購読エラー: ${error.message}`, "error");
    console.error("Push subscription error:", error);
  }
}

/**
 * プッシュ通知の購読を解除
 */
async function unsubscribePush() {
  try {
    if (!pushSubscription) {
      throw new Error("購読情報がありません");
    }

    addLog("🔄 プッシュ通知の購読を解除中...", "info");

    // ブラウザ側で購読を解除
    const success = await pushSubscription.unsubscribe();

    if (success) {
      // サーバーに購読解除を通知
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
      });

      addLog("✅ プッシュ通知の購読を解除しました", "success");

      pushSubscription = null;
      updatePushStatus("unsubscribed");
      updatePushButtons(true, false);
    }
  } catch (error) {
    addLog(`❌ 購読解除エラー: ${error.message}`, "error");
  }
}

/**
 * サーバーからプッシュ通知を送信
 */
async function sendPushNotification() {
  try {
    const title = document.getElementById("push-title").value;
    const body = document.getElementById("push-body").value;

    addLog("📤 サーバーにプッシュ通知送信をリクエスト中...", "info");

    const response = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        icon: "/assets/icon.png",
        badge: "/assets/badge.png",
        url: "/",
      }),
    });

    const result = await response.json();

    if (result.success) {
      addLog(
        `✅ プッシュ通知を送信しました: 成功 ${result.results.success}件, 失敗 ${result.results.failed}件`,
        "success"
      );
    } else {
      addLog(`⚠️ ${result.message}`, "warning");
    }
  } catch (error) {
    addLog(`❌ プッシュ送信エラー: ${error.message}`, "error");
  }
}

/**
 * 既存の購読状態をチェック
 */
async function checkExistingSubscription() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      swRegistration = registration;
      addLog("✅ Service Workerが既に登録されています", "info");

      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        pushSubscription = subscription;
        addLog("✅ プッシュ通知を既に購読しています", "info");
        updatePushStatus(
          "subscribed",
          `エンドポイント: ${subscription.endpoint.substring(0, 50)}...`
        );
        updatePushButtons(true, true);
      } else {
        updatePushStatus("registered");
        updatePushButtons(true, false);
      }
    } else {
      updatePushStatus("unregistered");
      updatePushButtons(false, false);
    }
  } catch (error) {
    console.error("購読状態チェックエラー:", error);
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

  // Push APIの初期化
  if ("serviceWorker" in navigator && "PushManager" in window) {
    addLog("✅ Push APIをサポートしています", "success");
    checkExistingSubscription();
  } else {
    addLog("⚠️ このブラウザはPush APIをサポートしていません", "warning");
    document.getElementById("register-sw").disabled = true;
    updatePushStatus("unregistered", "Push APIはサポートされていません");
  }

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
      options.image = "/assets/img.png";
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
  // Push API イベントリスナー
  // ========================================

  // Service Worker登録
  document.getElementById("register-sw").addEventListener("click", async () => {
    await registerServiceWorker();
  });

  // プッシュ通知購読
  document
    .getElementById("subscribe-push")
    .addEventListener("click", async () => {
      await subscribePush();
    });

  // プッシュ通知購読解除
  document
    .getElementById("unsubscribe-push")
    .addEventListener("click", async () => {
      await unsubscribePush();
    });

  // サーバーからプッシュ通知送信
  document.getElementById("send-push").addEventListener("click", async () => {
    await sendPushNotification();
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
