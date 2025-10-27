/**
 * AWS Lambda用エントリポイント（DynamoDB版）
 * API Gateway + Lambda + DynamoDBでデプロイする場合に使用
 *
 * Lambda はステートレスなため、購読情報をDynamoDBに永続化します。
 */
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import webpush from "web-push";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// DynamoDBクライアント設定
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || "";

// 環境変数から読み込み
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const app = new Hono();

// CORS設定（S3からのアクセスを許可）
app.use(
  "/*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ========================================
// Notification API エンドポイント
// ========================================

app.post("/api/log", async (c) => {
  const body = await c.req.json();
  console.log("[Notification Log]", body);
  return c.json({ success: true });
});

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
// Push API エンドポイント（DynamoDB版）
// ========================================

app.get("/api/push/vapid-public-key", (c) => {
  return c.json({ publicKey: VAPID_PUBLIC_KEY });
});

// 購読を保存（DynamoDB）
app.post("/api/push/subscribe", async (c) => {
  try {
    const subscription = await c.req.json();

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          endpoint: subscription.endpoint,
          subscription: JSON.stringify(subscription),
          createdAt: new Date().toISOString(),
          expiresAt: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90日後に自動削除
        },
      })
    );

    console.log("✅ 購読を保存:", subscription.endpoint);

    // 購読者数を取得
    const countResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Select: "COUNT",
      })
    );

    return c.json({
      success: true,
      message: "プッシュ通知の購読を登録しました",
      totalSubscriptions: countResult.Count || 0,
    });
  } catch (error) {
    console.error("❌ 購読登録エラー:", error);
    return c.json({ success: false, error: "購読登録に失敗しました" }, 500);
  }
});

// 購読を削除（DynamoDB）
app.post("/api/push/unsubscribe", async (c) => {
  try {
    const { endpoint } = await c.req.json();

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { endpoint },
      })
    );

    console.log("🗑️ 購読を削除:", endpoint);

    // 購読者数を取得
    const countResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Select: "COUNT",
      })
    );

    return c.json({
      success: true,
      message: "プッシュ通知の購読を解除しました",
      totalSubscriptions: countResult.Count || 0,
    });
  } catch (error) {
    console.error("❌ 購読解除エラー:", error);
    return c.json({ success: false, error: "購読解除に失敗しました" }, 500);
  }
});

// プッシュ通知を送信（DynamoDB）
app.post("/api/push/send", async (c) => {
  try {
    const { title, body, icon, badge, url, tag } = await c.req.json();

    // DynamoDBから全購読者を取得
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    if (!result.Items || result.Items.length === 0) {
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

    console.log(
      `📤 プッシュ通知を送信中... (${result.Items.length}人の購読者)`
    );

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 全購読者に通知を送信
    const promises = result.Items.map(async (item) => {
      try {
        const subscription = JSON.parse(item.subscription as string);
        await webpush.sendNotification(subscription, payload);
        results.success++;
        console.log(
          "✅ 通知送信成功:",
          (item.endpoint as string).substring(0, 50) + "..."
        );
      } catch (error: any) {
        results.failed++;

        // 410エラー（購読が無効）の場合は削除
        if (error.statusCode === 410) {
          await docClient.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: { endpoint: item.endpoint },
            })
          );
          console.log(
            "🗑️ 無効な購読を削除:",
            (item.endpoint as string).substring(0, 50) + "..."
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

    return c.json({
      success: true,
      message: `プッシュ通知を送信しました`,
      results: {
        total: results.success + results.failed,
        success: results.success,
        failed: results.failed,
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

// 購読者数を取得（DynamoDB）
app.get("/api/push/subscriptions/count", async (c) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Select: "COUNT",
      })
    );

    const count = result.Count || 0;
    return c.json({
      count,
      message: `現在${count}人が購読中です`,
    });
  } catch (error) {
    console.error("❌ 購読数取得エラー:", error);
    return c.json({ count: 0, message: "エラーが発生しました" }, 500);
  }
});

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dynamodb: TABLE_NAME,
    version: "dynamodb",
  });
});

// Lambda handler
export const handler = handle(app);
