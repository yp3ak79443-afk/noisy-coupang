const API_BASE = "https://mama-coupang-api.yp3ak79443.workers.dev";

const $ = id => document.getElementById(id);

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

  // 自動尋找酷澎 API 回傳的 productData
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

  // 最後用遞迴方式尋找 productData
  function findProductData(obj) {
    if (!obj || typeof obj !== "object") {
      return null;
    }

    if (Array.isArray(obj.productData)) {
      return obj.productData;
    }

    for (const key of Object.keys(obj)) {
      const result = findProductData(obj[key]);

      if (Array.isArray(result)) {
        return result;
      }
    }

    return null;
  }

  return findProductData(d) || [];
}
/* =========================
   顯示商品
========================= */

function render(items) {

  const container = $("products");

  if (!container) {
    return;
  }

  if (!items.length) {

    container.innerHTML =
      "<div class='empty'>沒有找到符合條件的商品</div>";

    return;
  }


  container.innerHTML = items.map(p => {

    const img =
      p.productImage ||
      p.productImageUrl ||
      p.imageUrl ||
      p.lifestyleImageUrl ||
      "";

    const url =
      p.productUrl ||
      p.productUrlDirect ||
      "#";

    const name =
      p.productName ||
      p.title ||
      "酷澎商品";

    const price =
      Number(
        p.productPrice ||
        p.salePrice ||
        p.firstPurchasePrice ||
        0
      );

    const firstPurchasePrice =
      Number(p.firstPurchasePrice || 0);

    const rocket =
      p.isRocket === true;

    return `
      <article class="card">

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


        <div class="body">

          <div class="name">
            ${esc(name)}
          </div>


          ${
            price
              ? `
                <div class="price">
                  NT$ ${price.toLocaleString("zh-TW")}
                </div>
              `
              : ""
          }


          ${
            firstPurchasePrice &&
            firstPurchasePrice < price
              ? `
                <div class="first-price">
                  首購優惠 NT$ ${firstPurchasePrice.toLocaleString("zh-TW")}
                </div>
              `
              : ""
          }


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

          </div>


          ${
            url !== "#"
              ? `
                <a
                  class="buy"
                  href="${esc(url)}"
                  target="_blank"
                  rel="noopener sponsored nofollow"
                >
                  前往酷澎
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

  const input = $("searchInput");

  if (!input) {
    return;
  }

  const q = input.value.trim();

  if (!q) {

    $("status").textContent =
      "請輸入商品名稱";

    return;
  }


  $("status").textContent =
    `正在搜尋「${q}」…`;


  $("searchBtn").disabled = true;


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

    } catch {

      throw new Error(
        API 回傳格式錯誤（HTTP ${r.status}）
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
        ? 找到 ${items.length} 筆商品
        : "沒有找到符合條件的商品";


  } catch (e) {

    console.error(e);


    $("products").innerHTML = `
      <div class="empty">
        ${esc(e.message || "搜尋失敗")}
      </div>
    `;


    $("status").textContent =
      "搜尋失敗";


  } finally {

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

  searchForm.onsubmit = e => {

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

  clearBtn.onclick = () => {

    $("searchInput").value = "";

    $("resultTitle").textContent =
      "搜尋商品";

    $("status").textContent =
      "";

    $("products").innerHTML =
      "<div class='empty'>輸入商品名稱開始搜尋</div>";

  };

}


/* =========================
   快速搜尋按鈕
========================= */

document
  .querySelectorAll("[data-keyword]")
  .forEach(button => {

    button.onclick = () => {

      const keyword =
        button.dataset.keyword;

      $("searchInput").value =
        keyword;

      search();

    };

  });
