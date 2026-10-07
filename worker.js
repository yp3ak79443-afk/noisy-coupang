const DEFAULT_BASE = "https://api-gateway.tw.coupang.com";
const API_ROOT = "/v2/providers/affiliate_open_api/apis/openapi";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: cors()
      });
    }

    const u = new URL(request.url);

    try {
      // =========================
      // Health Check
      // =========================
      if (u.pathname === "/api/health") {
        return json({
          ok: true,
          service: "coupang-affiliate-worker",
          gateway: env.COUPANG_API_BASE || DEFAULT_BASE
        });
      }

      // =========================
      // Debug
      // =========================
      if (u.pathname === "/api/debug") {
        return debug(env);
      }

      // =========================
      // 商品搜尋
      // =========================
      if (u.pathname === "/api/search") {
        const keyword = (u.searchParams.get("keyword") || "").trim();

        if (!keyword) {
          return json({
            ok: false,
            message: "請輸入搜尋關鍵字"
          }, 400);
        }

        const limit = Math.min(
          Math.max(
            Number(u.searchParams.get("limit") || 20),
            1
          ),
          20
        );

        const query = new URLSearchParams({
          keyword,
          limit: String(limit),
          subId: env.COUPANG_SUB_ID,
          imageSize: "512x512"
        }).toString();

        return callCoupang(
          env,
          "GET",
          `${API_ROOT}/products/search`,
          query
        );
      }

      return json({
        ok: false,
        message: "Not Found"
      }, 404);

    } catch (e) {
      return json({
        ok: false,
        message: e?.message || "Worker error"
      }, 500);
    }
  }
};


// ==================================================
// Debug
// ==================================================

async function debug(env) {

  const gateway = env.COUPANG_API_BASE || DEFAULT_BASE;

  let gatewayStatus = null;
  let gatewayStatusText = "";
  let contentType = "";
  let body = "";

  try {

    const r = await fetch(
      gateway + "/",
      {
        headers: {
          "X-MARKET": "TW"
        }
      }
    );

    gatewayStatus = r.status;
    gatewayStatusText = r.statusText;
    contentType = r.headers.get("content-type") || "";
    body = (await r.text()).slice(0, 1000);

  } catch (e) {

    body = "GATEWAY_FETCH_FAILED: " + (
      e?.message || String(e)
    );

  }


  // ==================================================
  // 查詢 Cloudflare 實際出口 IP
  // ==================================================

  let publicIp = "";

  try {

    const ipResponse = env.EGRESS
      ? await env.EGRESS.fetch(
          "https://api.ipify.org?format=json"
        )
      : await fetch(
          "https://api.ipify.org?format=json"
        );

    publicIp = (
      await ipResponse.text()
    ).slice(0, 200);

  } catch (e) {

    publicIp = "IP_CHECK_FAILED";

  }


  return json({

    ok: true,

    gateway,

    gatewayStatus,

    gatewayStatusText,

    contentType,

    publicIp,

    hasAccessKey: !!env.COUPANG_ACCESS_KEY,

    hasSecretKey: !!env.COUPANG_SECRET_KEY,

    hasSubId: !!env.COUPANG_SUB_ID,

    market: "TW",

    body

  });
}


// ==================================================
// Coupang GET
// ==================================================

async function callCoupang(
  env,
  method,
  path,
  query
) {

  if (
    !env.COUPANG_ACCESS_KEY ||
    !env.COUPANG_SECRET_KEY
  ) {

    return json({
      ok: false,
      message: "Worker 尚未設定酷澎 API 憑證"
    }, 500);

  }


  // ==================================================
  // Coupang Signed Date
  // ==================================================

  const d = new Date();

  const signedDate =
    String(
      d.getUTCFullYear()
    ).slice(2) +

    String(
      d.getUTCMonth() + 1
    ).padStart(2, "0") +

    String(
      d.getUTCDate()
    ).padStart(2, "0") +

    "T" +

    String(
      d.getUTCHours()
    ).padStart(2, "0") +

    String(
      d.getUTCMinutes()
    ).padStart(2, "0") +

    String(
      d.getUTCSeconds()
    ).padStart(2, "0") +

    "Z";


  // ==================================================
  // HMAC Message
  // ==================================================

  const message =
    signedDate +
    method +
    path +
    query;


  const signature = await hmacSha256(
    env.COUPANG_SECRET_KEY,
    message
  );


  // ==================================================
  // Authorization
  // 注意：逗號後面不加空格
  // ==================================================

  const authorization =
    `CEA algorithm=HmacSHA256,access-key=${env.COUPANG_ACCESS_KEY},signed-date=${signedDate},signature=${signature}`;


  const base =
    env.COUPANG_API_BASE ||
    DEFAULT_BASE;


  const target =
    base +
    path +
    (query ? "?" + query : "");


  // ==================================================
  // Request Coupang
  // ==================================================

  const response = await fetch(
    target,
    {
      method,

      headers: {

        "Authorization": authorization,

        "X-MARKET": "TW",

        "Content-Type":
          "application/json;charset=UTF-8",

        "User-Agent":
          "coupang-tw-affiliate-site"

      }
    }
  );


  const text = await response.text();

  let data;


  try {

    data = JSON.parse(text);

  } catch {

    data = {
      raw: text.slice(0, 1500)
    };

  }


  // ==================================================
  // Coupang Error
  // ==================================================

  if (
    !response.ok ||
    data?.raw
  ) {

    return json({

      ok: false,

      status: response.status,

      statusText: response.statusText,

      endpoint: path,

      contentType:
        response.headers.get(
          "content-type"
        ) || "",

      message:
        data?.rMessage ||
        data?.message ||
        "Coupang API request failed",

      coupang: data

    }, response.ok ? 502 : response.status);

  }


  // ==================================================
  // Success
  // ==================================================

  return json(
    data,
    response.status
  );
}


// ==================================================
// HMAC SHA256
// ==================================================

async function hmacSha256(
  secret,
  message
) {

  const key =
    await crypto.subtle.importKey(

      "raw",

      new TextEncoder().encode(
        secret
      ),

      {
        name: "HMAC",
        hash: "SHA-256"
      },

      false,

      ["sign"]

    );


  const signature =
    await crypto.subtle.sign(

      "HMAC",

      key,

      new TextEncoder().encode(
        message
      )

    );


  return [
    ...new Uint8Array(
      signature
    )
  ]

    .map(
      b =>
        b
          .toString(16)
          .padStart(2, "0")
    )

    .join("");
}


// ==================================================
// CORS
// ==================================================

function cors() {

  return {

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Methods":
      "GET,OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type,Authorization"

  };

}


// ==================================================
// JSON Response
// ==================================================

function json(
  data,
  status = 200
) {

  return new Response(

    JSON.stringify(data),

    {

      status,

      headers: {

        "Content-Type":
          "application/json;charset=UTF-8",

        ...cors()

      }

    }

  );

}
