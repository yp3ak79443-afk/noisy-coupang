const API_BASE = "https://mama-coupang-api.yp3ak79443.workers.dev";

const $ = id => document.getElementById(id);


/* =========================
   HTML 安全處理
========================= */

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));


/* =========================
   取得商品資料
========================= */

function getItems(d) {

  if (Array.isArray(d)) {
    return d;
  }

  if (Array.isArray(d?.data?.data?.data?.productData)) {
    return d.data.data.data.productData;
  }

  if (Array.isArray(d?.data?.data?.productData)) {
    return d.data.data.productData;
  }

  if (Array.isArray(d?.data?.productData)) {
    return d.data.productData;
  }

  if (Array.isArray(d?.productData)) {
    return d.productData;
  }


  function findProductData(obj) {

    if (!obj || typeof obj !== "object") {
      return null;
    }

    if (Array.isArray(obj.productData)) {
      return obj.productData;
    }

    for (const key of Object.keys(obj)) {

      const result =
        findProductData(obj[key]);

      if (Array.isArray(result)) {
        return result;
      }

    }

    return null;
  }


  return findProductData(d) || [];

}


/* =========================
   取得商品網址
   優先使用分潤網址
========================= */

function getProductUrl(p) {

  /*
    如果你的酷澎 API 已經回傳分潤網址，
    這裡會自動抓取。

    支援常見欄位：
    affiliateUrl
    affiliateURL
    partnerUrl
    partnerURL
    deeplink
    deepLink
    trackingUrl
    trackingURL
  */

  const affiliateUrl =
    p.affiliateUrl ||
    p.affiliateURL ||
    p.partnerUrl ||
    p.partnerURL ||
    p.deeplink ||
    p.deepLink ||
    p.trackingUrl ||
    p.trackingURL;


  if (
    affiliateUrl &&
    typeof affiliateUrl === "string" &&
    affiliateUrl.startsWith("http")
  ) {

    return {
      url: affiliateUrl,
      isAffiliate: true
    };

  }


  /*
    如果沒有分潤網址，
    暫時使用一般商品網址。
  */

  const normalUrl =
    p.productUrl ||
    p.productUrlDirect ||
    p.url ||
    "#";


  return {
    url: normalUrl,
    isAffiliate: false
  };

}


/* =========================
   顯示商品
========================= */

function render(items) {

  const container =
    $("products");


  if (!container) {
    return;
  }


  if (!items.length) {

    container.innerHTML =
      "<div class='empty'>沒有找到符合條件的商品</div>";

    return;

  }


  container.innerHTML =
    items.map(p => {


      /* ---------- 圖片 ---------- */

      const img =
        p.productImage ||
        p.productImageUrl ||
        p.imageUrl ||
        p.lifestyleImageUrl ||
        "";


      /* ---------- 商品網址 ---------- */

      const productLink =
        getProductUrl(p);

      const url =
        productLink.url;

      const isAffiliate =
        productLink.isAffiliate;


      /* ---------- 商品名稱 ---------- */

      const name =
        p.productName ||
        p.title ||
        "酷澎商品";


      /* ---------- 價格 ---------- */

      const price =
        Number(
          p.productPrice ||
          p.salePrice ||
          p.price ||
          p.firstPurchasePrice ||
          0
        );


      /* ---------- 首購價 ---------- */

      const firstPurchasePrice =
        Number(
          p.firstPurchasePrice ||
          p.firstOrderPrice ||
          p.firstPurchaseProductPrice ||
          0
        );


      /* ---------- 首購省多少 ---------- */

      const firstSave =
        (
          price > 0 &&
          firstPurchasePrice > 0 &&
          firstPurchasePrice < price
        )
          ? price - firstPurchasePrice
          : 0;


      /* ---------- Rocket ---------- */

      const rocket =
        p.isRocket === true ||
        p.rocket === true;


      /* ---------- 評價 ---------- */

      const rating =
        Number(
          p.rating ||
          p.productRating ||
          0
        );


      /* ---------- 評價數 ---------- */

      const reviewCount =
        Number(
          p.reviewCount ||
          p.ratingCount ||
          p.reviewCnt ||
          0
        );


      return `
        <article class="card">


          <!-- 商品圖片 -->

          <div class="pic">

            ${
              img

                ? `
                  <img
                    loading="lazy"
                    src="${esc(img)}"
                    alt="${esc(name)}"
                    onerror="this.style.display='none'"
                  >
                `

                : `
                  <div class="no-image">
                    暫無圖片
                  </div>
                `
            }

          </div>


          <!-- 商品內容 -->

          <div class="body">


            <!-- 商品名稱 -->

            <div class="name">
              ${esc(name)}
            </div>


            <!-- 價格 -->

            ${
              price

                ? `
                  <div class="price">
                    NT$ ${price.toLocaleString("zh-TW")}
                  </div>
                `

                : ""
            }


            <!-- 首購價格 -->

            ${
              firstPurchasePrice &&
              firstPurchasePrice < price

                ? `
                  <div class="first-price">
                    🔥 首購優惠
                    NT$ ${firstPurchasePrice.toLocaleString("zh-TW")}
                  </div>
                `

                : ""
            }


            <!-- 首購省多少 -->

            ${
              firstSave > 0

                ? `
                  <div class="save">
                    省 NT$ ${firstSave.toLocaleString("zh-TW")}
                  </div>
                `

                : ""
            }


            <!-- 商品資訊 -->

            <div class="meta">


              ${
                rocket

                  ? `
                    <span class="tag rocket">
                      🚀 Rocket
                    </span>
                  `

                  : ""
              }


              ${
                rating > 0

                  ? `
                    <span class="tag rating">
                      ⭐ ${rating.toFixed(1)}
                    </span>
                  `

                  : ""
              }


              ${
                reviewCount > 0

                  ? `
                    <span class="tag reviews">
                      ${reviewCount.toLocaleString("zh-TW")} 評價
                    </span>
                  `

                  : ""
              }


            </div>


            <!-- 分潤提示 -->

            ${
              isAffiliate

                ? `
                  <div class="affiliate-badge">
                    💰 分潤優惠連結
                  </div>
                `

                : ""
            }


            <!-- 前往酷澎 -->

            ${
              url !== "#"

                ? `
                  <a
                    class="buy"
                    href="${esc(url)}"
                    target="_blank"
                    rel="noopener sponsored nofollow"
                  >
                    ${
                      isAffiliate
                        ? "🔥 前往酷澎優惠"
                        : "前往酷澎"
                    }
                  </a>
                `

                : `
                  <button
                    class="buy"
                    type="button"
                    disabled
                  >
                    暫無商品連結
                  </button>
                `
            }


          </div>

        </article>
      `;

    }).join("");

}


/* =========================
   搜尋商品
========================= */

async function search() {

  const input =
    $("searchInput");


  if (!input) {
    return;
  }


  const q =
    input.value.trim();


  if (!q) {

    $("status").textContent =
      "請輸入商品名稱";

    return;

  }


  $("status").textContent =
    `正在搜尋「${q}」…`;


  $("searchBtn").disabled =
    true;


  try {


    const apiUrl =
      `${API_BASE}/api/search` +
      `?keyword=${encodeURIComponent(q)}` +
      `&limit=10`;


    const r =
      await fetch(apiUrl);


    const t =
      await r.text();


    let d;


    try {

      d =
        JSON.parse(t);

    }

    catch {

      throw new Error(
        `API 回傳格式錯誤（HTTP ${r.status}）`
      );

    }


    if (!r.ok) {

      throw new Error(
        d?.message ||
        API 錯誤（HTTP ${r.status}）
      );

    }


    if (d?.ok === false) {

      throw new Error(
        d?.message ||
        "酷澎 API 暫時無法使用"
      );

    }


    const items =
      getItems(d);


    $("resultTitle").textContent =
      `搜尋：${q}`;


    render(items);


    $("status").textContent =
      items.length

        ? `找到 ${items.length} 筆商品`

        : "沒有找到符合條件的商品";


  }

  catch (e) {

    console.error(e);


    $("products").innerHTML = `
      <div class="empty">
        ${esc(e.message || "搜尋失敗")}
      </div>
    `;


    $("status").textContent =
      "搜尋失敗";

  }


  finally {

    $("searchBtn").disabled =
      false;

  }

}


/* =========================
   搜尋表單
========================= */

const searchForm =
  $("searchForm");


if (searchForm) {

  searchForm.onsubmit =
    e => {

      e.preventDefault();

      search();

    };

}


/* =========================
   清除搜尋
========================= */

const clearBtn =
  $("clearBtn");


if (clearBtn) {

  clearBtn.onclick =
    () => {

      $("searchInput").value =
        "";

      $("resultTitle").textContent =
        "搜尋商品";

      $("status").textContent =
        "";

      $("products").innerHTML =
        `
        <div class="empty">
          輸入商品名稱開始搜尋
        </div>
        `;

    };

}


/* =========================
   快速搜尋
========================= */

document
  .querySelectorAll("[data-keyword]")
  .forEach(button => {

    button.onclick =
      () => {

        const keyword =
          button.dataset.keyword;


        $("searchInput").value =
          keyword;


        search();

      };

  });
