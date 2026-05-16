# IndexNow 実装ガイド — 0-TOOLs

## 概要

`main` ブランチへの push 時に、変更された HTML ページを自動的に IndexNow API へ送信し、検索エンジン（Bing・Yandex など）に即時インデックス登録を促します。同時に `sitemap.xml` も自動再生成します。

---

## ファイル構成

```
.github/workflows/indexnow.yml   ← GitHub Actions ワークフロー
scripts/generate_sitemap.py      ← sitemap.xml 自動生成スクリプト
scripts/submit_indexnow.py       ← IndexNow 送信スクリプト
scripts/setup_key.py             ← APIキー新規生成ヘルパー（鍵ローテーション時のみ使用）
4w1xrszrjqzy7bkdy8f763ym4ukouf2r.txt  ← IndexNow 所有権確認用キーファイル
robots.txt                       ← Sitemap URL 記載済み
sitemap.xml                      ← 自動更新される XML サイトマップ
```

---

## 初回セットアップ（必須）

### 1. キーファイルを GitHub にプッシュ

キーファイル `4w1xrszrjqzy7bkdy8f763ym4ukouf2r.txt` をリポジトリに含めた状態で push してください。  
GitHub Pages が配信することで、以下の URL でアクセス可能になります：

```
https://0-tools.com/4w1xrszrjqzy7bkdy8f763ym4ukouf2r.txt
```

### 2. GitHub Secrets に API キーを登録

1. GitHubリポジトリ → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリック
3. 以下を入力して保存：

| Name | Secret |
|------|--------|
| `INDEXNOW_KEY` | `4w1xrszrjqzy7bkdy8f763ym4ukouf2r` |

---

## 動作確認手順

### Step 1: キーファイルのアクセス確認

push 後にブラウザで確認：

```
https://0-tools.com/4w1xrszrjqzy7bkdy8f763ym4ukouf2r.txt
```

ページに `4w1xrszrjqzy7bkdy8f763ym4ukouf2r` とだけ表示されれば OK。

### Step 2: ワークフローの実行確認

1. HTML ファイルを変更して `main` ブランチへ push
2. GitHub リポジトリ → **Actions** タブを開く
3. `IndexNow Submit & Sitemap Update` ワークフローが起動していることを確認
4. ログの `Submit to IndexNow` ステップで以下のような出力が出ればOK：

```
Submitting 1 URL(s) to IndexNow:
  https://0-tools.com/tools/xxx/
  https://api.indexnow.org/indexnow: 200 OK
  https://www.bing.com/indexnow: 200 OK
Done.
```

### Step 3: sitemap.xml の自動更新確認

ワークフロー完了後、`sitemap.xml` が更新されている場合は  
`chore: update sitemap.xml [skip ci]` というコミットが自動で作成されます。

GitHub → **Commits** タブで確認できます。

### Step 4: Bing Webmaster Tools で確認（任意）

1. [Bing Webmaster Tools](https://www.bing.com/webmasters) にログイン
2. サイト `0-tools.com` を選択
3. **URL の送信** または **IndexNow** レポートで送信済み URL を確認

---

## 自動化の仕組み

```
git push (*.html 変更) 
  └─► GitHub Actions 起動
        ├─► 変更された .html ファイルを検出
        ├─► generate_sitemap.py で sitemap.xml 再生成
        ├─► sitemap が変わっていれば bot がコミット [skip ci]
        └─► submit_indexnow.py で IndexNow API に POST
              ├─► api.indexnow.org  (Bing / Yandex / その他パートナー)
              └─► www.bing.com/indexnow
```

### 対象ファイル

- `tools/**/*.html` — ツールページ
- `blog/**/*.html` — ブログ記事
- `*.html` / その他サブディレクトリの `index.html`

### 除外ファイル

- `sample*.html` / パス中に `sample` を含むファイル
- `contact/thanks/index.html`

---

## API キーのローテーション（更新）

キーを変えたい場合：

```bash
python scripts/setup_key.py
```

出力に従い、新しいキーファイルをコミットして GitHub Secret を更新してください。  
古いキーファイル（`4w1xrszrjqzy7bkdy8f763ym4ukouf2r.txt`）は削除してください。

---

## ローカルでのテスト実行

**sitemap.xml 生成のみ（API 送信なし）:**

```bash
python scripts/generate_sitemap.py
```

**IndexNow 送信（キーとURLを指定）:**

```bash
# PowerShell
$env:INDEXNOW_KEY = "4w1xrszrjqzy7bkdy8f763ym4ukouf2r"
$env:CHANGED_FILES = "tools/xxx/index.html,blog/xxx-guide/index.html"
python scripts/submit_indexnow.py

# bash
INDEXNOW_KEY=4w1xrszrjqzy7bkdy8f763ym4ukouf2r \
CHANGED_FILES=tools/xxx/index.html python scripts/submit_indexnow.py
```

---

## robots.txt

`robots.txt` には既に Sitemap が記載されています（変更不要）：

```
User-agent: *
Allow: /

Sitemap: https://0-tools.com/sitemap.xml
```
