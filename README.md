# Renta Nagasaka — Portfolio

Apple の製品ページに着想を得た、フレームワーク不要の静的ポートフォリオサイト。
`index.html` / `styles.css` / `script.js` の 3 ファイルだけで動きます。

## ローカルで見る

```bash
python3 -m http.server 5174
```

ブラウザで http://localhost:5174 を開く（`index.html` を直接ダブルクリックしても動きます）。

## 編集する場所

| 編集したい内容 | 場所 |
| --- | --- |
| 名前・肩書き・ヒーローの文章 | `index.html` の `<section class="hero">` |
| 自己紹介・数字 | `#about`（`data-count` の値を変えると数字が変わる） |
| スキルカード | `#skills` の `.card`（`card--wide` で 2 列幅） |
| 代表プロジェクト | `#featured` |
| プロジェクト一覧 | `#projects` の `.tile`（色は `tile--blue / purple / green / orange / mono`） |
| プロジェクトの画面ギャラリー | `script.js` の `GALLERIES`（`data-gallery` 属性のタイルをクリックで開く）。画像は `assets/stylemagic/`・`assets/english/` に追加して `images` に行を足す |
| 経歴 | `#experience` の `.timeline__item` |
| サービス（AI 導入・開発・動画） | `#services` の `.service` |
| 連絡先 | `#contact` の `mailto:` と SNS リンク |
| プロフィールカード（左上のアイコンで開く） | `<dialog id="profileCard">` と `script.js` の vCard 生成部分 |
| 履歴書 | `assets/resume.pdf` を置く |

仮の値は残っていません。リンク・メールはすべて実際のものです。
Featured セクションのデバイス枠には IPA 試験トレーナーの公開ページを iframe で埋め込んでいます（`#featured` の `<iframe src>`）。

## 問い合わせフォームを有効にする（Google Apps Script）

「メッセージを送る」はページ内のフォームです。送信先として GAS のウェブアプリを使います。

1. `tools/gas-contact-form.gs` の内容を https://script.google.com の新しいプロジェクトに貼り付ける
2. デプロイ → 新しいデプロイ → ウェブアプリ（実行: 自分 / アクセス: 全員）→ URL をコピー
3. `script.js` の `CONTACT_ENDPOINT` にその URL を入れて push

設定済み（2026-10-26、GAS プロジェクト名 `portfolio-contact`）。GAS 側のコードを変えたら「デプロイを管理」から新バージョンで再デプロイすれば URL はそのままです。URL を空にすると、送信ボタンは入力内容を本文に入れてメールアプリを開く動作に戻ります。

## 公開する（GitHub Pages）

1. GitHub で新しいリポジトリを作る（例: `portfolio`）
2. このフォルダをプッシュ
3. Settings → Pages → Branch を `main` / `(root)` にして Save
4. 数分で `https://<ユーザー名>.github.io/portfolio/` に公開される

Vercel / Netlify / Cloudflare Pages にフォルダをドラッグ＆ドロップしても公開できます（ビルド設定不要）。

## デザインの構成要素

- 固定ガラス調ナビ（`backdrop-filter`）
- 巨大タイポグラフィ + グラデーション文字のヒーロー、動くブラー背景
- 黒 / オフホワイトの交互セクション
- スクロールで現れる要素（IntersectionObserver）
- ベントーグリッドのスキルカード
- スクロール連動で起き上がるデバイスモック（`animation-timeline: view()`、未対応ブラウザは JS でフォールバック）
- スナップスクロールのプロジェクトカルーセル
- 背景は `<canvas id="bg">` に描く光の線のアニメーション（`script.js` の「Background: flowing light lines」）。暗い領域が画面内にあるときだけ動き、スクロールとマウスにわずかに反応
- ギャラリーの画像はクリックで拡大（ライトボックス、矢印キーで前後）
- OG 画像は `assets/og-image.jpg`（1200×630）。`404.html` は GitHub Pages が自動で使う
- 読み込み時のイントロ（ロゴの線画 → 名前 → 上方向へのワイプ）。合計約 1.5 秒。同じタブでは 1 回だけ再生、クリックでスキップ、`prefers-reduced-motion` では非表示。長さは `script.js` の `INTRO_MS`
- 左上のアイコンでプロフィールカード（名刺）が開き、連絡先を .vcf で保存できる
- ヒーローのタイピングアニメーション（文言は `#typewriter` の `data-phrases`）
- 技術名が流れるティッカー、見出しの単語ごとのスライドイン
- カードのマウス追従 3D チルト、ヒーローのパララックス、タイムラインの線が伸びるスクロール連動
- `prefers-reduced-motion` 対応（すべての動きを止めます）
