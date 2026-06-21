# 電子書籍 出版診断ツール ― Netlifyデプロイ手順

## 構成
```
ebook-diagnostic-tool/
├── index.html                          ← 診断シート＋レポート画面（フロントエンド）
├── netlify.toml                        ← Netlify設定
└── netlify/functions/
    └── generate-report.js              ← AIレポート生成（サーバー側・APIキーはここだけで使用）
```

AIによる診断レポート生成は「Netlify Functions」というサーバー側の仕組みで動きます。
APIキーはサーバー側の環境変数として保存されるため、サイトを訪れた人には一切見えません。

---

## 手順1：Anthropic APIキーを取得する

1. https://console.anthropic.com/ にアクセスしてログイン（アカウントがなければ作成）
2. 左メニューの「API Keys」から新しいキーを発行
3. `sk-ant-...` から始まるキーをコピーしておく（一度しか表示されないので必ず保存）

※ このAPIキーには利用量に応じた課金が発生します。レポート1件あたり数円程度です。

---

## 手順2：Netlifyアカウントを作成する

1. https://www.netlify.com/ にアクセスして無料アカウントを作成

---

## 手順3：Netlify CLIでデプロイする

ターミナル（Mac の場合は「ターミナル」アプリ、Windows の場合は PowerShell）を開いて、以下を順番に実行します。

```bash
# Netlify CLIをインストール（初回のみ）
npm install -g netlify-cli

# ログイン（ブラウザが開くので、Netlifyアカウントでログイン）
netlify login

# このフォルダに移動
cd ebook-diagnostic-tool

# サイトを初期化
netlify init
```

`netlify init` を実行すると、いくつか質問されます：
- "What would you like to do?" → **Create & configure a new site**
- チーム選択 → 自分のアカウントを選択
- サイト名 → 好きな名前を入力（例：ebook-shindan）

初期化が終わったら、APIキーを環境変数として設定します：

```bash
netlify env:set ANTHROPIC_API_KEY "sk-ant-ここに取得したキーを貼り付け"
```

最後に本番デプロイします：

```bash
netlify deploy --prod
```

完了すると、`https://（サイト名）.netlify.app` のようなURLが発行されます。
これが相談者に共有できる診断ツールのURLです。

---

## 手順4：動作確認

1. 発行されたURLにアクセス
2. シートに記入
3. 「診断レポートを生成する」を押す
4. レポートが表示されたら成功です

うまくいかない場合は、Netlifyのダッシュボード → サイトを選択 → 「Functions」タブでエラーログが確認できます。
多くの場合、APIキーの設定漏れが原因です（手順3の `netlify env:set` をやり直してください）。

---

## 運用メモ

- **マルシェ会場での使用**：タブレットやスマホでURLを開いておけば、その場で記入→レポート生成→PDF保存まで完結します
- **シートだけ使いたい場合**：「ここまでで終わる」を選べば、AIレポートを使わずシート記入のみで完結します（API課金は発生しません）
- **内容を編集したい場合**：`index.html` 内の質問文・選択肢・配色（`#0F6E56` など）を直接編集して、再度 `netlify deploy --prod` を実行してください
