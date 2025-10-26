import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import webpush from "web-push";

// VAPID鍵の設定
// 本番環境では環境変数から読み込むことを推奨
const VAPID_PUBLIC_KEY =
  "BHGKGy2bq76_mV1prFGwQtutnfVmTSfGdd5EuiSxcUXS1tuotsCzD-nUwaWPrADOEfYlpY-vbfFiDHKlMblBalg";
const VAPID_PRIVATE_KEY = "VU258PkG-0ctwsJcFInpw-BTwTFWGncCV8Z8ZykX6OY";

webpush.setVapidDetails(
  "mailto:test@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const app = new Hono();

// プッシュ購読情報を保存（本番環境ではデータベースに保存すべき）
const subscriptions = new Set<webpush.PushSubscription>();

// 静的ファイル配信
app.use("/*", serveStatic({ root: "./public" }));

// ========================================
// Notification API エンドポイント
// ========================================

// APIエンドポイント（オプション：学習用ログ記録）
app.post("/api/log", async (c) => {
  const body = await c.req.json();
  console.log("[Notification Log]", body);
  return c.json({ success: true });
});

// デモ用通知データ
app.get("/api/notifications", (c) => {
  return c.json({
    examples: [
      {
        title: "基本的な通知",
        options: {
          body: "これはシンプルな通知メッセージです",
        },
      },
      {
        title: "リッチ通知",
        options: {
          body: "アイコンとバッジ付きの通知",
          icon: "/assets/icon.png",
          badge: "/assets/badge.png",
        },
      },
    ],
  });
});

// ========================================
// Push API エンドポイント
// ========================================

// VAPID公開鍵を取得
app.get("/api/push/vapid-public-key", (c) => {
  return c.json({ publicKey: VAPID_PUBLIC_KEY });
});

// プッシュ購読を登録
app.post("/api/push/subscribe", async (c) => {
  try {
    const subscription = await c.req.json();

    // 購読情報を保存（本番環境ではDBに保存）
    subscriptions.add(subscription);

    console.log("✅ 新しいプッシュ購読を登録:", subscription.endpoint);
    console.log(`📊 現在の購読数: ${subscriptions.size}`);

    return c.json({
      success: true,
      message: "プッシュ通知の購読を登録しました",
      totalSubscriptions: subscriptions.size,
    });
  } catch (error) {
    console.error("❌ 購読登録エラー:", error);
    return c.json({ success: false, error: "購読登録に失敗しました" }, 500);
  }
});

// プッシュ購読を解除
app.post("/api/push/unsubscribe", async (c) => {
  try {
    const { endpoint } = await c.req.json();

    // 購読情報を削除
    for (const sub of subscriptions) {
      if (sub.endpoint === endpoint) {
        subscriptions.delete(sub);
        console.log("🗑️ プッシュ購読を解除:", endpoint);
        break;
      }
    }

    console.log(`📊 現在の購読数: ${subscriptions.size}`);

    return c.json({
      success: true,
      message: "プッシュ通知の購読を解除しました",
      totalSubscriptions: subscriptions.size,
    });
  } catch (error) {
    console.error("❌ 購読解除エラー:", error);
    return c.json({ success: false, error: "購読解除に失敗しました" }, 500);
  }
});

// プッシュ通知を全購読者に送信
app.post("/api/push/send", async (c) => {
  try {
    const { title, body, icon, badge, url, tag } = await c.req.json();

    if (subscriptions.size === 0) {
      return c.json(
        {
          success: false,
          message: "購読者がいません",
        },
        400
      );
    }

    const payload = JSON.stringify({
      title: title || "プッシュ通知",
      body: body || "サーバーから通知が届きました",
      icon: icon || "/assets/icon.png",
      badge: badge || "/assets/badge.png",
      url: url || "/",
      tag: tag || "server-push",
    });

    console.log(`📤 プッシュ通知を送信中... (${subscriptions.size}人の購読者)`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 全ての購読者に通知を送信
    const promises = Array.from(subscriptions).map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
        results.success++;
        console.log(
          "✅ 通知送信成功:",
          subscription.endpoint.substring(0, 50) + "..."
        );
      } catch (error: any) {
        results.failed++;

        // 410エラー（購読が無効）の場合は削除
        if (error.statusCode === 410) {
          subscriptions.delete(subscription);
          console.log(
            "🗑️ 無効な購読を削除:",
            subscription.endpoint.substring(0, 50) + "..."
          );
        }

        console.error("❌ 通知送信失敗:", error.message);
        results.errors.push(error.message);
      }
    });

    await Promise.all(promises);

    console.log(
      `📊 送信結果: 成功 ${results.success}件, 失敗 ${results.failed}件`
    );
    console.log(`📊 残りの購読数: ${subscriptions.size}`);

    return c.json({
      success: true,
      message: `プッシュ通知を送信しました`,
      results: {
        total: results.success + results.failed,
        success: results.success,
        failed: results.failed,
        currentSubscriptions: subscriptions.size,
      },
    });
  } catch (error: any) {
    console.error("❌ プッシュ送信エラー:", error);
    return c.json(
      {
        success: false,
        error: error.message || "プッシュ通知の送信に失敗しました",
      },
      500
    );
  }
});

// 現在の購読者数を取得
app.get("/api/push/subscriptions/count", (c) => {
  return c.json({
    count: subscriptions.size,
    message: `現在${subscriptions.size}人が購読中です`,
  });
});

const port = 3000;
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
  }
);
