# 0-TOOLs — Claude Code 作業指針

このファイルはClaude Codeが自動的に読み込む指示書です。

## サイト概要

- URL: https://0-tools.com
- 静的HTMLサイト（サーバーサイド処理なし・ブラウザ完結型ツール群）
- 収益: Google AdSense
- 目標: 1日1ツール公開ペース

## 現在の方針（2026年6月〜）
- **育児・子育て特化サイトとして運営**
- 新規ツール・ブログ記事は育児ジャンルのみ作成すること
- 既存の非育児ツールはnoindex済み・HTMLコメントで保持中（削除不要）
- 育児カテゴリ（data-category="baby"）を最優先で使用すること

---

## ツール公開の標準ワークフロー

**「〇〇ツールを作りたい」と依頼があったら、以下をすべて自律的に実施する。個別に指示がなくても全項目を実行すること。**

---

### 【A】ツール本体（HTML / CSS / JS）

#### スマホ特化
- タップターゲット最小 **44×44px**（Google推奨）
- ボタン・インタラクティブ要素に `touch-action: manipulation`（ダブルタップズーム防止）
- ファイル入力は `accept="application/pdf,.pdf"` のように拡張子も併記（iOS Files app対応）
- `max-width: 480px` で補助情報（サイズ表示等）を `display:none`
- `font-size` 最小13px、本文14〜16px

#### SEO対策
- `<title>` にキーワード含有
- `<meta name="description">` 120〜140文字
- `<link rel="canonical">` 正規URL
- OG tags（og:title / og:description / og:type="website" / og:url / og:image）
- `<meta name="twitter:card" content="summary">`
- JSON-LD: **WebApplication + BreadcrumbList + FAQPage + HowTo**（すべて必須）
  - FAQPage: ツールに関するQ&Aを3〜5件（セキュリティ・使い方・形式の違いなど）
  - HowTo: ツールの操作手順を3ステップ程度（totalTime: "PT1M"）

#### セキュリティ

- **XSS対策**: ユーザー入力・外部データを `innerHTML` に展開する場合は必ず `esc()` でエスケープする。`textContent` への代入はエスケープ不要。
  ```js
  function esc(s){
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  ```
- **`onclick` 属性にユーザー値を直接展開しない**: インラインイベントハンドラに変数を埋め込む代わりに `addEventListener` + クロージャで渡す。
- **インポート入力の検証**: 外部JSONをインポートする場合、各フィールドを型・長さ・値域でフィルタリングしてから `S` に反映する。
  - 配列要素: `typeof f === 'string' && f.length > 0 && f.length <= 50`
  - 日付文字列: `/^\d{4}-\d{2}-\d{2}$/.test(d)` などで形式確認
- **`localStorage` への保存前に型を確認**: 想定外の型がストアに書き込まれないよう、保存ロジックは型ガードを通す。
- **ツール完成後に以下を自己チェックすること**:
  - [ ] `innerHTML` を使っている箇所すべてに `esc()` が適用されているか
  - [ ] `onclick` 属性にユーザー由来の文字列が含まれていないか
  - [ ] インポート処理に型・長さバリデーションがあるか
  - [ ] `eval` / `new Function` / `document.write` を使っていないか

#### Google AdSense 申請対応
- `<meta name="google-adsense-account" content="ca-pub-6769343629657319">` を全ページに入れる
- `<meta name="google-site-verification">` を既存ページからコピー
- プライバシーバッジ（「ファイルは端末外に送信されません」）を入れる
- 「このツールについて」折りたたみセクション（仕組み・なぜ無料か・安全性）を入れる
- フッターに著作権・ナビリンク（ホーム・関連ツール・ブログ・FAQ・プライバシーポリシー）
- ツール専用 `style.css` を使う（`page.css` ではない）

---

### 【B】内部リンク

- 新ツールのフッター `<nav>` に既存の関連ツールへのリンクを入れる
- 既存の関連ツールのフッター `<nav>` に新ツールへのリンクを追加する
- トップページ（`index.html`）の対応カテゴリに `<a class="tool-card">` を追加

---

### 【C】Google インデックス登録対応

**`sitemap.xml` 更新:**
- ツールページ `<url>` 追加（priority: 0.8 / changefreq: monthly / lastmod: 今日）
- ブログ記事 `<url>` 追加（priority: 0.7 / changefreq: monthly / lastmod: 今日）
- `blog/` の lastmod を今日の日付に更新

**`sitemap/index.html` 更新:**
- 該当カテゴリのセクションにツールリンクを追加
- ブログセクションにブログ記事リンクを追加

---

### 【D】ブログ記事作成・公開

**ファイル:** `blog/{tool-name}-guide/index.html`

必須要素:
- title / description / canonical / OG / Twitter Card
- article:published_time / article:modified_time
- JSON-LD: **Article + BreadcrumbList + FAQPage**（3種）
- Article JSON-LD に `speakable` を追加: `{"@type":"SpeakableSpecification","cssSelector":[".article-title",".article-body"]}`
- パンくずリスト（ホーム > ブログ > 記事名）
- 記事ヘッダー（カテゴリバッジ・タイトル・日付・読了時間・著者）
- 目次（toc）
- 本文（導入 → 比較表/背景 → ステップ手順 → コツ → FAQ → まとめ）
- CTAボックス（ツールへの誘導）
- シェアボタン（𝕏）
- related-section（関連ツール2件 + 関連記事2件）

カテゴリ（`data-category`）:
- `pdf` → PDF活用
- `image` → 画像変換
- `web` → Web制作
- `guide` → 使い方ガイド

**`blog/index.html` 更新:** `.blog-grid` の**先頭**に記事カード追加（新しい順）

---

### 【E】実施順序

1. ツール本体（index.html / style.css / main.js）— スマホ・SEO・AdSense対応込み
2. トップページ（index.html）にツールカード追加
3. 関連ツールのフッターに相互リンク追加
4. ブログ記事（blog/{slug}/index.html）作成
5. blog/index.html に記事カード追加（先頭）
6. sitemap.xml 更新（ツール + ブログ記事）
7. sitemap/index.html 更新（ツール + ブログ記事）

> **IndexNow は自動化済み**
> `main` ブランチへ push すると GitHub Actions が自動的に:
> - 変更された HTML URL を IndexNow API (Bing・Yandex) へ送信
> - `sitemap.xml` を再生成してコミット
>
> 手動送信は不要。詳細は [README-INDEXNOW.md](README-INDEXNOW.md) を参照。

---

## サイト固有の設定値

| 項目 | 値 |
|------|-----|
| AdSense パブリッシャーID | `ca-pub-6769343629657319` |
| GA4 測定ID | `G-S6LH1TXVP8` |
| サイト認証 | `<meta name="google-site-verification" content="wjbUCUovh1Qbnv4qczntyVJstAfRlQh7R6nQk2jWIU8">` |

### GA4 スニペット（新ページ作成時に `<head>` 直後に必ず挿入すること）

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S6LH1TXVP8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S6LH1TXVP8');
</script>
```
