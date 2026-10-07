const DEFAULT_BASE = "https://api-gateway.tw.coupang.com";
const API_ROOT = "/v2/providers/affiliate_open_api/apis/openapi";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Content-Type": "application/json; charset=UTF-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      const baseUrl =
        env.COUPANG_API_BASE || DEFAULT_BASE;

      // =========================
      // Health
      // =========================
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          worker: "mama-coupang-api",
          gateway: baseUrl,
          market: "TW"
        }, corsHeaders);
      }

      // =========================
      // Debug
      // =========================
      if (url.pathname === "/api/debug") {
        let publicIp = "";

        try {
          const ipResponse = env.EGRESS
            ? await env.EGRESS.fetch(
                "https://api.ipify.org?format=json"
              )
            : await fetch(
                "https://api.ipify.org?format=json"
              );

          publicIp = await ipResponse.text();
        } catch (e) {
          publicIp = "IP check failed";
        }

        const response = await fetch(
          baseUrl + "/",
          {
            method: "GET",
            headers: {
              "X-MARKET": "TW",
              "User-Agent": "mama-coupang-api/1.0"
            }
          }
        );

        const body = await response.text();

        return json({
          ok: true,
          gateway: baseUrl,
          gatewayStatus: response.status,
          gatewayStatusText: response.statusText,
          contentType:
            response.headers.get("content-type") || "",
          publicIp,
          hasAccessKey:
            !!env.COUPANG_ACCESS_KEY,
          hasSecretKey:
            !!env.COUPANG_SECRET_KEY,
          hasSubId:
            !!env.COUPANG_SUB_ID,
          market: "TW",
          body: body.slice(0, 3000)
        }, corsHeaders);
      }

      // =========================
      // Reco API 測試
      // =========================
      if (url.pathname === "/api/reco-test") {
        const result =
          await callRecoAPI(env, baseUrl);

        return json(
          result,
          corsHeaders
        );
      }

      // ===============================
      // Coupang 熱門活動
      // ===============================
if (url.pathname === "/api/events") {
  const limit = Math.min(
    Math.max(
      Number(url.searchParams.get("limit") || 20),
      1
    ),
    100
  );

  const path = `${API_ROOT}/v1/events`;

  const query =
    `limit=${limit} `+
    `&subId=${encodeURIComponent(env.COUPANG_SUB_ID || "")}`;

  const result = await callCoupang(
    env,
    baseUrl,
    "GET",
    path,
    query,
    null
  );

  if (!result.ok) {
    return json({
      ok: false,
      status: result.status,
      statusText: result.statusText,
      endpoint: path,
      contentType: result.contentType,
      message: "Coupang events API request failed",
      raw: result.body
    }, corsHeaders, 200);
  }

  return json({
    ok: true,
    data: result.data,
    raw: result.data ? null : result.body,
    status: result.status,
    contentType: result.contentType
  }, corsHeaders);
}


// ===============================
// 指定活動商品
// ===============================
if (url.pathname === "/api/events-products") {
  const eventId = url.searchParams.get("eventId");

  const limit = Math.min(
    Math.max(
      Number(url.searchParams.get("limit") || 20),
      1
    ),
    100
  );

  const offset = Math.max(
    Number(url.searchParams.get("offset") || 0),
    0
  );

  if (!eventId) {
    return json({
      ok: false,
      message: "請提供 eventId"
    }, corsHeaders, 400);
  }

  const path =
    `${API_ROOT}/v1/events/${encodeURIComponent(eventId)}/products`;

  const query =
    `limit=${limit}` +
    `&offset=${offset}` +
    `&subId=${encodeURIComponent(env.COUPANG_SUB_ID || "")}` +
    `&imageSize=512x512`;

  const result = await callCoupang(
    env,
    baseUrl,
    "GET",
    path,
    query,
    null
  );

  if (!result.ok) {
    return json({
      ok: false,
      status: result.status,
      statusText: result.statusText,
      endpoint: path,
      contentType: result.contentType,
      message: "Coupang event products API request failed",
      raw: result.body
    }, corsHeaders, 200);
  }

  return json({
    ok: true,
    data: result.data,
    raw: result.data ? null : result.body,
    status: result.status,
    contentType: result.contentType
  }, corsHeaders);
}


      
      // =========================
      // 商品搜尋
      // =========================
      if (url.pathname === "/api/search") {
        const keyword =
          url.searchParams.get("keyword") || "";

        const limit = Math.min(
          Math.max(
            Number(
              url.searchParams.get("limit") || 10
            ),
            1
          ),
          20
        );

        if (!keyword.trim()) {
          return json({
            ok: false,
            message: "請輸入搜尋關鍵字"
          }, corsHeaders, 400);
        }

        const path =
          `${API_ROOT}/v1/products/search`;

        // 正確的 Query String
        const query =
            `keyword=${encodeURIComponent(keyword)}` +
            `&limit=${limit}` +
            `&subId=${encodeURIComponent(env.COUPANG_SUB_ID || "")}` +
            `&imageSize=512x512`;
        
const tunnelBase =
  "https://science-perception-accommodations-buzz.trycloudflare.com";

const response =
  await fetch(
    `${tunnelBase}/api/search?${query}`
  );

const responseText =
  await response.text();

let data = null;

try {
  data = JSON.parse(responseText);
} catch (e) {
  data = null;
}

return json({
  ok: response.ok,
  status: response.status,
  data,
  raw: data ? null : responseText
}, corsHeaders);
}
      // =========================
      // Not Found
      // =========================
      return json({
        ok: false,
        message: "Not Found"
      }, corsHeaders, 404);

    } catch (error) {
      return json({
        ok: false,
        error: error.message,
        stack: error.stack || ""
      }, corsHeaders, 500);
    }
  }
};


// ======================================================
// Reco API
// ======================================================

async function callRecoAPI(
  env,
  baseUrl
) {
  const path =
    `${API_ROOT}/v2/products/reco`;

  let publicIp = "";

  try {
    const ipResponse = env.EGRESS
      ? await env.EGRESS.fetch(
          "https://api.ipify.org?format=json"
        )
      : await fetch(
          "https://api.ipify.org?format=json"
        );

    const ipJson =
      await ipResponse.json();

    publicIp =
      ipJson.ip || "";

  } catch (e) {
    publicIp = "";
  }

  const body = {
    site: {
      domain:
        "https://yp3ak79443-afk.github.io/noisy-coupang/",
      id:
        "noisy-coupang"
    },

    device: {
      id:
        "mama-coupang-test",
      ip:
        publicIp,
      lmt:
        1,
      ua:
        "Mozilla/5.0"
    },

    imp: {
      adType:
        1,
      imageSize:
        "512x512",
      placementId:
        "noisy-coupang-home",
      pos:
        1
    },

    affiliate: {
      subId:
        env.COUPANG_SUB_ID || "Kai",
      subParam:
        "reco-test"
    }
  };

  const result =
    await callCoupang(
      env,
      baseUrl,
      "POST",
      path,
      "",
      body
    );

  return {
    ok:
      result.ok,

    status:
      result.status,

    statusText:
      result.statusText,

    endpoint:
      path,

    contentType:
      result.contentType,

    requestBody:
      body,

    data:
      result.data || null,

    raw:
      result.data
        ? null
        : result.body
  };
}


// ======================================================
// Coupang HMAC API
// ======================================================

async function callCoupang(
  env,
  baseUrl,
  method,
  path,
  query,
  body
) {
  const signedDate =
    getSignedDate();

  const message =
    signedDate +
    method +
    path +
    query;

  const signature =
    await makeHmacSignature(
      env.COUPANG_SECRET_KEY,
      message
    );

  const authorization =
    `CEA algorithm=HmacSHA256,access-key=${env.COUPANG_ACCESS_KEY},signed-date=${signedDate},signature=${signature}`;

  // 正確組合 URL
  const target =
  baseUrl +
  path +
  (query ? `?${query}` : "");

  const headers = {
    "Authorization":
      authorization,

    "X-MARKET":
      "TW",

    "Content-Type":
      "application/json;charset=UTF-8",

    "User-Agent":
      "mama-coupang-api/1.0"
  };

  const options = {
    method,
    headers
  };

  if (
    body !== null &&
    body !== undefined
  ) {
    options.body =
      JSON.stringify(body);
  }

  const response =
    env.EGRESS
      ? await env.EGRESS.fetch(
          target,
          options
        )
      : await fetch(
          target,
          options
        );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const responseText =
    await response.text();

  let data = null;

  try {
    data =
      JSON.parse(responseText);
  } catch (e) {
    data = null;
  }

  return {
    ok:
      response.ok,

    status:
      response.status,

    statusText:
      response.statusText,

    contentType,

    data,

    body:
      responseText.slice(
        0,
        10000
      )
  };
}


// ======================================================
// HMAC-SHA256
// ======================================================

async function makeHmacSignature(
  secretKey,
  message
) {
  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        secretKey
      ),
      {
        name:
          "HMAC",
        hash:
          "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(
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
        b.toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// ======================================================
// Coupang signed date
// ======================================================

function getSignedDate() {
  const now =
    new Date();

  const yyyy =
    now.getUTCFullYear();

  const MM =
    String(
      now.getUTCMonth() + 1
    ).padStart(2, "0");

  const dd =
    String(
      now.getUTCDate()
    ).padStart(2, "0");

  const HH =
    String(
      now.getUTCHours()
    ).padStart(2, "0");

  const mm =
    String(
      now.getUTCMinutes()
    ).padStart(2, "0");

  const ss =
    String(
      now.getUTCSeconds()
    ).padStart(2, "0");

  return (
  `${String(yyyy).slice(-2)}${MM}${dd}T${HH}${mm}${ss}Z`
  );
}


// ======================================================
// JSON Response
// ======================================================

function json(
  data,
  headers,
  status = 200
) {
  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,
      headers
    }
  );
}
