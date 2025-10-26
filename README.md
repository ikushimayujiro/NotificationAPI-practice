# 🔔 Notification API デモアプリ

Web Notification API の主要機能を学習するためのインタラクティブなデモアプリケーションです。

## 📚 学習できる内容

このアプリでは以下の Notification API と Push API の機能を実践的に学習できます：

### 📱 Notification API（基本的な通知）

- ✅ **通知の許可リクエスト** - ユーザーから通知権限を取得
- 📨 **基本的な通知** - シンプルなテキスト通知の表示
- ✨ **リッチ通知** - アイコン、バッジ、画像、アクション付き通知
- 🎯 **通知のイベント処理** - クリック、閉じる、表示などのイベントハンドリング
- 🎨 **通知のオプション** - バッジ、振動パターン、タグ、方向性など

### 🔥 Push API（サーバーからのプッシュ通知）

- 🛠️ **Service Worker** - バックグラウンドでプッシュを受信
- 🔑 **VAPID 認証** - セキュアなプッシュ通知の実装
- 📡 **PushManager.subscribe()** - プッシュ通知の購読と購読解除
- 📤 **サーバー連携** - Node.js（Hono）からプッシュ通知を送信
- 💾 **購読管理** - 購読情報の保存と管理

### 📜 その他

- 🎯 **リアルタイムログ** - 全ての通知イベントを記録・表示

## 🛠️ 技術スタック

- **フロントエンド**: バニラ JavaScript (ES6+), HTML5, CSS3
- **バックエンド**: [Hono](https://hono.dev/) (TypeScript) + [web-push](https://github.com/web-push-libs/web-push)
- **Service Worker**: プッシュ通知の受信とバックグラウンド処理
- **パッケージマネージャー**: pnpm
- **開発環境**: Node.js + tsx

## 📦 セットアップ

### 前提条件

- Node.js (v18 以上)
- pnpm

### インストール

```bash
# 依存パッケージをインストール
pnpm install
```

## 🚀 起動方法

### 開発モード（ホットリロード）

```bash
pnpm dev
```

### 本番ビルド

```bash
# TypeScriptをコンパイル
pnpm build

# ビルドしたアプリを起動
pnpm start
```

### アクセス

ブラウザで以下の URL にアクセス：

```
http://localhost:3000
```

## 📂 プロジェクト構造

```
test_notification_api/
├── src/
│   └── index.ts              # Honoサーバー（静的ファイル配信 + API + Push送信）
├── public/
│   ├── index.html            # メインページ
│   ├── styles.css            # スタイルシート
│   ├── app.js                # Notification API + Push APIのロジック
│   ├── sw.js                 # Service Worker（プッシュ受信）
│   └── assets/
│       ├── icon.png          # 通知アイコン
│       └── badge.png         # 通知バッジ
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 主要機能

### 1. 通知許可の管理

- 現在の許可状態（granted/denied/default）を表示
- ワンクリックで許可リクエストを送信
- 視覚的なフィードバック

### 2. 基本的な通知

```javascript
new Notification("タイトル", {
  body: "メッセージ本文",
});
```

- タイトルと本文を自由にカスタマイズ
- シンプルな通知の表示

### 3. リッチ通知

```javascript
new Notification("タイトル", {
  body: "メッセージ本文",
  icon: "/assets/icon.png",
  badge: "/assets/badge.png",
  image: "/assets/image.png",
  requireInteraction: true,
  silent: false,
  tag: "unique-tag",
});
```

- アイコン、バッジ、画像の表示
- 操作要求やサイレントモードの設定
- タグによる通知の置き換え

### 4. イベントハンドリング

全ての通知イベントを監視・ログ記録：

- `onshow` - 通知が表示された時
- `onclick` - 通知がクリックされた時
- `onclose` - 通知が閉じられた時
- `onerror` - エラーが発生した時

### 5. プリセット通知

ワンクリックで以下の通知を送信：

- ✅ 成功通知
- ⚠️ 警告通知
- ❌ エラー通知
- ℹ️ 情報通知

### 6. カスタムオプション

- **振動パターン**: モバイルデバイスでの振動制御
- **テキスト方向**: LTR/RTL/自動
- **言語**: 通知の言語設定

## 🌐 API エンドポイント

### 静的ファイル配信

- `GET /` - HTML, CSS, JS, アセットを配信

### Notification API

- `POST /api/log` - クライアント側のイベントログを記録（学習用）
- `GET /api/notifications` - デモ用通知データを取得

### Push API

- `GET /api/push/vapid-public-key` - VAPID 公開鍵を取得
- `POST /api/push/subscribe` - プッシュ購読を登録
- `POST /api/push/unsubscribe` - プッシュ購読を解除
- `POST /api/push/send` - 全購読者にプッシュ通知を送信
- `GET /api/push/subscriptions/count` - 現在の購読者数を取得

## 🔥 Push API の仕組み

### 概要図

```
1. Service Worker登録
   ブラウザ → Service Workerを登録 (/sw.js)

2. プッシュ購読（Subscribe）
   ブラウザ → サーバーからVAPID公開鍵を取得
   ブラウザ → PushManager.subscribe() を呼び出し
   ブラウザ → 購読オブジェクト（endpoint + keys）を取得
   ブラウザ → サーバーに購読情報を送信

3. プッシュ通知送信
   サーバー → web-pushライブラリで通知をプッシュサーバーに送信
   プッシュサーバー（Chrome/Firefox/Safari） → ブラウザに配信
   Service Worker → push イベントを受信
   Service Worker → 通知を表示

4. ユーザーインタラクション
   ユーザー → 通知をクリック
   Service Worker → notificationclick イベント
   Service Worker → 指定URLを開く
```

### 重要な概念

#### 1. Service Worker

バックグラウンドで動作する JavaScript で、ブラウザが閉じていてもプッシュを受信できます。

```javascript
// Service Workerの登録
const registration = await navigator.serviceWorker.register("/sw.js");
```

#### 2. PushManager.subscribe()

プッシュ通知を購読するためのメソッド。VAPID 公開鍵が必要です。

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true, // ユーザーに見える通知のみ（必須）
  applicationServerKey: vapidPublicKey, // VAPID公開鍵
});
```

**返り値（購読オブジェクト）:**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...", // 暗号化用公開鍵
    "auth": "..." // 認証シークレット
  }
}
```

#### 3. VAPID（Voluntary Application Server Identification）

サーバーを識別するための鍵ペア。プッシュサーバーがどのアプリから送信されたかを検証します。

```bash
# VAPID鍵の生成
npx web-push generate-vapid-keys
```

#### 4. プッシュ通知の送信

サーバー側で web-push ライブラリを使用して送信します。

```typescript
import webpush from "web-push";

// VAPID設定
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// プッシュ送信
await webpush.sendNotification(
  subscription, // 購読オブジェクト
  JSON.stringify({
    title: "タイトル",
    body: "メッセージ",
    icon: "/icon.png",
  })
);
```

### 実装の流れ

1. **Service Worker を登録** (`/sw.js`)
2. **VAPID 公開鍵を取得** (`GET /api/push/vapid-public-key`)
3. **PushManager.subscribe()を呼び出し** （購読オブジェクトを取得）
4. **サーバーに購読情報を送信** (`POST /api/push/subscribe`)
5. **サーバーからプッシュ送信** (`POST /api/push/send`)
6. **Service Worker でプッシュを受信** (`push`イベント)
7. **通知を表示** (`registration.showNotification()`)

### Notification API vs Push API

| 機能                       | Notification API                         | Push API                 |
| -------------------------- | ---------------------------------------- | ------------------------ |
| **送信元**                 | ブラウザ（クライアント側）               | サーバー                 |
| **Service Worker**         | 不要                                     | 必須                     |
| **ブラウザが閉じている時** | ❌ 受信不可                              | ✅ 受信可能（OS レベル） |
| **用途**                   | ユーザーアクションへの即時フィードバック | サーバーイベントの通知   |
| **実装難易度**             | 簡単                                     | やや複雑                 |

## ⚠️ 注意事項

1. **HTTPS 必須**: Notification API は安全なコンテキスト（HTTPS or localhost）でのみ動作します
2. **ブラウザサポート**:
   - Chrome/Edge: 完全サポート
   - Firefox: 完全サポート
   - Safari: 基本機能のみ（一部オプション非対応）
3. **権限**: 初回使用時にブラウザの通知許可が必要
4. **通知の持続時間**: OS やブラウザによって自動的に閉じられる時間が異なります

## 📖 学習リソース

### Notification API

- [MDN - Notifications API](https://developer.mozilla.org/ja/docs/Web/API/Notifications_API)
- [MDN - Notification](https://developer.mozilla.org/ja/docs/Web/API/Notification)
- [Can I Use - Notifications](https://caniuse.com/notifications)

### Push API

- [MDN - Push API](https://developer.mozilla.org/ja/docs/Web/API/Push_API)
- [MDN - PushManager](https://developer.mozilla.org/ja/docs/Web/API/PushManager)
- [MDN - Service Worker API](https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API)
- [Web.dev - Push Notifications](https://web.dev/push-notifications-overview/)
- [web-push ライブラリ](https://github.com/web-push-libs/web-push)

## 🎓 学習のヒント

### Notification API

1. **まず許可を取得**: 通知を試す前に、必ず許可リクエストを実行してください
2. **ログを活用**: 各イベントがログに記録されるので、動作を確認しながら学習できます
3. **オプションを試す**: 各オプションを有効/無効にして、どのように表示が変わるか確認しましょう
4. **タグの実験**: 同じタグの通知を複数送信して、置き換え動作を確認してください

### Push API

1. **順番に実行**: Service Worker 登録 → 購読 → プッシュ送信の順で試してください
2. **購読オブジェクトを確認**: コンソールで購読オブジェクトの構造を確認しましょう
3. **Service Worker のライフサイクル**: デベロッパーツールの「Application」タブで確認できます
4. **複数タブで試す**: 別のタブを開いて、両方で購読してプッシュを受信してみましょう
5. **エラーハンドリング**: 購読失敗や送信失敗のケースも確認してください

### デバッグ

- **デベロッパーツール**: ブラウザのコンソールで詳細なログを確認できます
- **Application タブ**: Service Worker の状態を確認（Chrome DevTools）
- **Network タブ**: API 通信を確認

## 🔧 カスタマイズ

### アイコンやバッジの変更

`public/assets/` ディレクトリ内の画像ファイルを置き換えてください。推奨サイズ：

- **icon.png**: 128x128px 以上
- **badge.png**: 64x64px 程度

### スタイルのカスタマイズ

`public/styles.css` のカラー変数を編集：

```css
:root {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

## 🤝 フィードバック

このデモアプリは学習目的で作成されています。改善案やバグ報告があればお気軽にお知らせください！

## 📝 ライセンス

MIT License

---

**Happy Learning! 🎉**
