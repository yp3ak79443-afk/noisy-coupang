/*
  GitHub Pages frontend
  只需要修改下面 API_BASE：
  例如 https://mama-coupang-api.你的帳號.workers.dev
*/
const API_BASE = "https://YOUR-WORKER.workers.dev";

const $ = id => document.getElementById(id);
const statusEl = $("status");

function status(msg){ statusEl.textContent = msg || ""; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function empty(el,msg="目前沒有資料"){
  el.innerHTML = `<div class="empty">${esc(msg)}</div>`;
}

function card(p){
  const tags = [
    p.isRocket ? '<span class="tag rocket">🚀 Rocket</span>' : "",
    p.isFreeShipping ? '<span class="tag free">免運</span>' : ""
  ].join("");
  const price = Number(p.productPrice || 0).toLocaleString("zh-TW");
  const image = p.productImage || p.productImageUrl || "";
  const url = p.productUrl || "#";
  return `<article class="card">
    <div class="pic"><img loading="lazy" src="${esc(image)}" alt=""></div>
    <div class="body">
      <div class="name">${esc(p.productName || "酷澎商品")}</div>
      <div class="price">NT$ ${price}</div>
      <div class="meta">${tags}</div>
      <a class="buy" href="${esc(url)}" target="_blank" rel="noopener">前往酷澎</a>
    </div>
  </article>`;
}

function render(el,items){
  el.innerHTML = Array.isArray(items) && items.length
    ? items.map(card).join("")
    : '<div class="empty">目前沒有商品資料</div>';
}

async function api(path){
  if(API_BASE.includes("YOUR-WORKER")){
    throw new Error("請先把 script.js 的 API_BASE 改成你的 Cloudflare Worker 網址");
  }
  const r = await fetch(API_BASE + path);
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.message || "API 連線失敗");
  return d.data ?? d;
}

async function loadGoldbox(){
  try{ render($("goldbox"), await api("/api/goldbox")); }
  catch(e){ empty($("goldbox"), e.message); }
}

async function loadCategories(){
  try{
    const d = await api("/api/hotcategories?top=10");
    $("categories").innerHTML = (d||[]).map((c,i)=>
      `<button class="chip ${i===0?"active":""}" data-id="${esc(c.categoryId)}">${esc(c.categoryName)}</button>`
    ).join("");

    document.querySelectorAll(".chip").forEach(b=>{
      b.onclick=()=>{
        document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        loadCategory(b.dataset.id,b.textContent);
      };
    });
    if(d?.[0]) loadCategory(d[0].categoryId,d[0].categoryName);
  }catch(e){
    $("categories").innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

async function loadCategory(id,name){
  $("categoryTitle").textContent = name || "熱門商品";
  try{ render($("products"), await api(`/api/category/${encodeURIComponent(id)}?limit=20`)); }
  catch(e){ empty($("products"), e.message); }
}

async function loadBest(){
  try{
    render($("best"), await api("/api/bestcategory/1014?limit=12"));
  }catch(e){
    empty($("best"), "暫時無法取得暢銷商品");
  }
}

async function search(){
  const q = $("searchInput").value.trim();
  if(!q) return;
  status("搜尋中…");
  try{
    const d = await api("/api/search?keyword="+encodeURIComponent(q)+"&limit=20");
    $("categoryTitle").textContent = "搜尋："+q;
    render($("products"), d);
    status("搜尋完成");
  }catch(e){ status(e.message); }
}

$("searchBtn").onclick=search;
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")search()});
$("refreshGoldbox").onclick=loadGoldbox;

loadGoldbox();
loadCategories();
loadBest();
