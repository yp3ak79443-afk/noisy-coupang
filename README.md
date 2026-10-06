# 媽媽好難 × 酷澎優惠網站

這是一個「GitHub Pages 前端 + Cloudflare Worker 後端 + 酷澎 Partners API」架構。

## 一、你需要的東西

1. GitHub 帳號
2. Cloudflare 帳號
3. 酷澎 Partners API 的 Access Key
4. 酷澎 Partners API 的 Secret Key
5. 已註冊的 Sub ID / 頻道 ID

⚠️ Access Key、Secret Key 絕對不要放在 `index.html`、`script.js` 或 GitHub。

## 二、GitHub Pages

把以下檔案放到 GitHub Repository 根目錄：

- index.html
- style.css
- script.js

`worker.js` 不需要被 GitHub Pages 執行，它是 Cloudflare Worker。

GitHub：
Settings → Pages → Deploy from a branch → main → /(root)

網站網址通常會是：

https://你的帳號.github.io/你的Repository/

## 三、建立 Cloudflare Worker

最簡單的方法：

1. 登入 Cloudflare
2. Workers & Pages
3. Create → Worker
4. 名稱可以叫：

mama-coupang-api

5. 把 `worker.js` 的完整內容貼進去
6. Deploy

## 四、設定 Worker Secrets

Cloudflare Worker → Settings → Variables and Secrets

新增：

COUPANG_ACCESS_KEY
COUPANG_SECRET_KEY
COUPANG_SUB_ID

三個都選 Secret。

不要把真正的金鑰寫入 GitHub。

## 五、設定 Worker Variables

可設定：

COUPANG_API_BASE
值：

https://api-gateway.coupang.com

BEST_CATEGORY_ID
值：

1014

1014 是生活用品分類的範例，可以之後換成你想要的分類。

## 六、把 Worker 網址放進 GitHub

打開：

script.js

找到：

const API_BASE = "https://YOUR-WORKER.workers.dev";

改成你的 Worker，例如：

const API_BASE = "https://mama-coupang-api.xxxxx.workers.dev";

然後重新上傳 / commit。

## 七、先測試 Worker

瀏覽器打開：

https://你的-worker.workers.dev/api/health

應該看到：

{"ok":true,"service":"coupang-affiliate-worker"}

## 八、測試 Goldbox

打開：

https://你的-worker.workers.dev/api/goldbox

如果 API 金鑰、Sub ID、HMAC、API 權限都正確，就會取得 Goldbox JSON。

## 九、重要：X-MARKET

台灣 API 請求需要：

X-MARKET: TW

Worker 已經自動加入。

## 十、API 路徑

目前 Worker 已準備：

GET /api/goldbox
GET /api/hotcategories
GET /api/category/{categoryId}
GET /api/bestcategory/{categoryId}
GET /api/search?keyword=...
POST /api/deeplink

對應酷澎 Partners API。

## 十一、HMAC

Worker 使用：

HmacSHA256

簽章內容：

signed-date + HTTP method + path + query

並建立：

Authorization: CEA algorithm=HmacSHA256, access-key=..., signed-date=..., signature=...

API 金鑰只會在 Cloudflare Worker 端使用。

## 十二、如果 API 回傳 401 / 403

先檢查：

1. Access Key 是否正確
2. Secret Key 是否正確
3. Sub ID 是否已註冊
4. Worker 是否真的使用 Secret
5. API 權限是否包含 Partners API
6. Cloudflare Worker 是否有正確設定
7. X-MARKET 是否為 TW

另外，酷澎 API 文件若之後調整 endpoint，優先以官方最新文件為準。

## 十三、之後可以再加的功能

- 商品搜尋結果 SEO 頁
- 分類獨立網址
- 商品詳細頁
- 今日爆品
- 折扣排序
- 價格排序
- Rocket 篩選
- 免運篩選
- 商品快取
- Google Search Console SEO
- Sitemap
- 自動產生優惠文章
- Threads 自動發文
- LINE 社群導流
