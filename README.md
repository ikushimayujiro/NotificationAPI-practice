# 🔔 Notification API デモアプリ

Web Notification API の主要機能を学習するためのインタラクティブなデモアプリケーションです。

## 📚 学習できる内容

このアプリでは以下の Notification API の機能を実践的に学習できます：

- ✅ **通知の許可リクエスト** - ユーザーから通知権限を取得
- 📨 **基本的な通知** - シンプルなテキスト通知の表示
- ✨ **リッチ通知** - アイコン、バッジ、画像、アクション付き通知
- 🎯 **通知のイベント処理** - クリック、閉じる、表示などのイベントハンドリング
- 🎨 **通知のオプション** - バッジ、振動パターン、タグ、方向性など
- 📜 **リアルタイムログ** - 全ての通知イベントを記録・表示

## 🛠️ 技術スタック

- **フロントエンド**: バニラ JavaScript (ES6+), HTML5, CSS3
- **バックエンド**: [Hono](https://hono.dev/) (TypeScript)
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
│   └── index.ts              # Honoサーバー（静的ファイル配信）
├── public/
│   ├── index.html            # メインページ
│   ├── styles.css            # スタイルシート
│   ├── app.js                # Notification APIのロジック
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

### `GET /`

静的ファイル（HTML, CSS, JS）を配信

## ⚠️ 注意事項

1. **HTTPS 必須**: Notification API は安全なコンテキスト（HTTPS or localhost）でのみ動作します
2. **ブラウザサポート**:
   - Chrome/Edge: 完全サポート
   - Firefox: 完全サポート
   - Safari: 基本機能のみ（一部オプション非対応）
3. **権限**: 初回使用時にブラウザの通知許可が必要
4. **通知の持続時間**: OS やブラウザによって自動的に閉じられる時間が異なります

## 📖 学習リソース

- [MDN - Notifications API](https://developer.mozilla.org/ja/docs/Web/API/Notifications_API)
- [MDN - Notification](https://developer.mozilla.org/ja/docs/Web/API/Notification)
- [Web.dev - Push Notifications](https://web.dev/push-notifications-overview/)
- [Can I Use - Notifications](https://caniuse.com/notifications)

## 🎓 学習のヒント

1. **まず許可を取得**: 通知を試す前に、必ず許可リクエストを実行してください
2. **ログを活用**: 各イベントがログに記録されるので、動作を確認しながら学習できます
3. **オプションを試す**: 各オプションを有効/無効にして、どのように表示が変わるか確認しましょう
4. **タグの実験**: 同じタグの通知を複数送信して、置き換え動作を確認してください
5. **デベロッパーツール**: ブラウザのコンソールで詳細なログを確認できます

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
