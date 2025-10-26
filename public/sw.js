// Service Worker for Push Notifications
// プッシュ通知を受信して表示するための Service Worker

console.log("📡 Service Worker loaded");

// Service Workerのインストール
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installed");
  self.skipWaiting();
});

// Service Workerのアクティベート
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activated");
  event.waitUntil(clients.claim());
});

// プッシュ通知を受信したときの処理
self.addEventListener("push", (event) => {
  console.log("📨 Push notification received:", event);

  // プッシュメッセージからデータを取得
  let data = {
    title: "プッシュ通知",
    body: "サーバーから通知が届きました",
    icon: "/assets/icon.png",
    badge: "/assets/badge.png",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // 通知を表示
  const promiseChain = self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || "/assets/icon.png",
    badge: data.badge || "/assets/badge.png",
    // tag: data.tag || "push-notification",
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || "/",
      ...data,
    },
  });

  event.waitUntil(promiseChain);
});

// 通知がクリックされたときの処理
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification clicked:", event);

  event.notification.close();

  // 通知に関連付けられたURLを開く
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 既に開いているタブがあれば、それにフォーカス
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // なければ新しいタブを開く
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 通知が閉じられたときの処理
self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notification closed:", event);
});
