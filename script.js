const API_BASE = "https://api.noisy-ec.com";

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
        `API 錯誤（HTTP ${r.status}）`
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

// ==============================
// 酷澎熱門活動
// ==============================

const COUPANG_SUB_ID = "Kai";

function getEventItems(d) {
  const candidates = [
    d?.data?.data,
    d?.data?.data?.data,
    d?.data?.data?.eventData,
    d?.data?.eventData,
    d?.eventData
  ];

  return candidates.find(Array.isArray) || [];
}

function getEventProducts(d) {
  const candidates = [
    d?.data?.data,
    d?.data?.data?.productData,
    d?.data?.data?.data,
    d?.data?.productData,
    d?.productData
  ];

  return candidates.find(Array.isArray) || getItems(d);
}

function formatEventDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric"
  });
}

function renderEvents(events) {
  const grid = $("eventsGrid");

  if (!grid) return;

  if (!events.length) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">😢</div>
        <strong>目前沒有熱門活動</strong>
      </div>
    `;
    return;
  }

  grid.innerHTML = events.map(event => {
    const eventId = event.eventId;
    const name =
      event.eventName ||
      event.name ||
      "酷澎熱門活動";

    const image =
      event.bannerImageUrl ||
      event.imageUrl ||
      event.eventImageUrl ||
      "";

    const productCount =
      event.productCount ||
      event.productsCount ||
      0;

    const start =
      formatEventDate(
        event.startDate ||
        event.startTime ||
        event.beginDate
      );

    const end =
      formatEventDate(
        event.endDate ||
        event.endTime ||
        event.finishDate
      );

    return `
      <article
        class="event-card"
        data-event-id="${esc(eventId)}"
      >
        ${
          image
            ? `
              <img
                src="${esc(image)}"
                alt="${esc(name)}"
                loading="lazy"
                onerror="this.style.display='none'"
              >
            `
            : `
              <div class="event-image-placeholder">
                🔥
              </div>
            `
        }

        <div class="event-body">
          <h3>${esc(name)}</h3>

          ${
            start || end
              ? `
                <div class="event-date">
                  📅 ${esc(start)}
                  ${start && end ? "～" : ""}
                  ${esc(end)}
                </div>
              `
              : ""
          }

          <div class="event-meta">
            ${
              productCount
                ? 🛍️ ${productCount} 件商品
                : "🛍️ 熱門商品"
            }
          </div>

          <button
            class="event-btn"
            type="button"
            data-event-id="${esc(eventId)}"
          >
            查看活動商品 →
          </button>
        </div>
      </article>
    `;
  }).join("");

  document
    .querySelectorAll("[data-event-id]")
    .forEach(el => {
      el.onclick = () => {
        const id = el.dataset.eventId;

        if (id) {
          loadEventProducts(id);
        }
      };
    });
}

async function loadEvents() {
  const status = $("eventsStatus");
  const grid = $("eventsGrid");

  if (!grid) return;

  if (status) {
    status.textContent = "正在載入酷澎熱門活動…";
  }

  try {
    const apiUrl =
      ${API_BASE}/api/events +
      ?limit=20 +
      `&subId=${encodeURIComponent(COUPANG_SUB_ID)}`;

    const r = await fetch(apiUrl);
    const t = await r.text();

    let d;

    try {
      d = JSON.parse(t);
    } catch {
      throw new Error(
        活動 API 回傳格式錯誤（HTTP ${r.status}）
      );
    }

    if (!r.ok || d?.ok === false) {
      throw new Error(
        d?.message ||
        活動 API 錯誤（HTTP ${r.status}）
      );
    }

    const events = getEventItems(d);

    renderEvents(events);

    if (status) {
      status.textContent =
        events.length
          ? 目前有 ${events.length} 個熱門活動
          : "目前沒有活動";
    }

  } catch (error) {
    console.error("loadEvents error:", error);

    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">⚠️</div>
        <strong>活動載入失敗</strong>
        <span>${esc(error.message || "請稍後再試")}</span>
      </div>
    `;

    if (status) {
      status.textContent = "活動載入失敗";
    }
  }
}

async function loadEventProducts(eventId) {
  const status = $("eventsStatus");

  if (status) {
    status.textContent = "正在載入活動商品…";
  }

  try {
    const apiUrl =
      ${API_BASE}/api/events-products +
      ?eventId=${encodeURIComponent(eventId)} +
      &limit=100 +
      &offset=0 +
      &subId=${encodeURIComponent(COUPANG_SUB_ID)} +
      `&imageSize=512x512`;

    const r = await fetch(apiUrl);
    const t = await r.text();

    let d;

    try {
      d = JSON.parse(t);
    } catch {
      throw new Error(
        活動商品 API 回傳格式錯誤（HTTP ${r.status}）
      );
    }

    if (!r.ok || d?.ok === false) {
      throw new Error(
        d?.message ||
        活動商品 API 錯誤（HTTP ${r.status}）
      );
    }

    const items = getEventProducts(d);

    $("resultTitle").textContent = "🔥 活動商品";

    render(items);

    if (status) {
      status.textContent =
        items.length
          ? 找到 ${items.length} 件活動商品
          : "此活動目前沒有商品";
    }

    window.scrollTo({
      top: $("products")?.offsetTop || 0,
      behavior: "smooth"
    });

  } catch (error) {
    console.error(
      "loadEventProducts error:",
      error
    );

    if (status) {
      status.textContent =
        error.message || "活動商品載入失敗";
    }
  }
}

const eventsRefreshBtn =
  $("eventsRefreshBtn");

if (eventsRefreshBtn) {
  eventsRefreshBtn.onclick = loadEvents;
}

// 載入熱門活動
loadEvents();




