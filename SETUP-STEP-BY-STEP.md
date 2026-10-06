# 從零開始設定｜照著做即可

## A. 建 GitHub Repository

建立一個新的 Repository，例如：

mama-coupang

把這 3 個前端檔案放進去：

index.html
style.css
script.js

先不用放 Worker。

---

## B. 開 GitHub Pages

Repository → Settings → Pages

Build and deployment：

Source：Deploy from a branch

Branch：

main
/(root)

Save。

等幾分鐘後會有 GitHub Pages 網址。

---

## C. 建 Cloudflare Worker

Cloudflare → Workers & Pages → Create

選 Worker。

名稱：

mama-coupang-api

把 `worker.js` 全部貼進去。

Deploy。

---

## D. 加 Secrets

Worker → Settings → Variables and Secrets

新增 Secret：

COUPANG_ACCESS_KEY

填你的酷澎 Access Key。

再新增：

COUPANG_SECRET_KEY

填你的酷澎 Secret Key。

再新增：

COUPANG_SUB_ID

填你的頻道 / Sub ID。

---

## E. 加 Variables

新增普通 Variable：

COUPANG_API_BASE

值：

https://api-gateway.coupang.com

新增：

BEST_CATEGORY_ID

值：

1014

---

## F. 測試

先開：

https://你的worker網址/api/health

看到：

ok: true

代表 Worker 正常。

再開：

https://你的worker網址/api/goldbox

如果有商品 JSON，API 串接成功。

---

## G. 串 GitHub Pages

GitHub Repository → `script.js`

把：

const API_BASE = "https://YOUR-WORKER.workers.dev";

改成你的 Worker 網址。

例如：

const API_BASE = "https://mama-coupang-api.xxxxx.workers.dev";

Commit changes。

---

## H. 完成

打開 GitHub Pages 網址。

首頁會自動：

1. 抓 Goldbox
2. 抓熱門分類
3. 點分類抓商品
4. 抓暢銷商品
5. 支援商品搜尋
6. 顯示 Rocket
7. 顯示免運
8. 點商品前往酷澎

---

## 注意

不要把：

COUPANG_ACCESS_KEY
COUPANG_SECRET_KEY

放進 GitHub。

這兩個一定要留在 Cloudflare Worker Secrets。
