const DEFAULT_BASE = "https://api-gateway.tw.coupang.com";
const API_ROOT = "/v2/providers/affiliate_open_api/apis/openapi";
const ALLOW_ORIGIN = "*";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          service: "coupang-affiliate-worker",
          gateway: env.COUPANG_API_BASE || DEFAULT_BASE,
          apiRoot: API_ROOT
        });
      }

      if (url.pathname === "/api/debug") {
        return debugCoupang(env);
      }

      if (url.pathname === "/api/goldbox") {
        return coupangGet(
          env,
          "/products/goldbox",
          cleanParams({
            subId: env.COUPANG_SUB_ID,
            imageSize: "512x512"
          })
        );
      }

      if (url.pathname === "/api/hotcategories") {
        return coupangGet(
          env,
          "/products/hotcategories",
          cleanParams({
            top: url.searchParams.get("top") || "10"
          })
        );
      }

      if (url.pathname.startsWith("/api/category/")) {
        const id = url.pathname.split("/").pop();

        return coupangGet(
          env,
          `/products/hotcategories/${encodeURIComponent(id)}`,
          cleanParams({
            limit: url.searchParams.get("limit") || "20",
            subId: env.COUPANG_SUB_ID,
            imageSize: "512x512"
          })
        );
      }

      if (url.pathname.startsWith("/api/bestcategory/")) {
        const id = url.pathname.split("/").pop();
        const categoryId = id || env.BEST_CATEGORY_ID || "1014";

        return coupangGet(
          env,
          `/products/bestcategories/${encodeURIComponent(categoryId)}`,
          cleanParams({
            limit: url.searchParams.get("limit") || "20",
            subId: env.COUPANG_SUB_ID,
            imageSize: "512x512"
          })
        );
      }

      if (url.pathname === "/api/search") {
        return coupangGet(
          env,
          "/products/search",
          cleanParams({
            keyword: url.searchParams.get("keyword") || "",
            limit: url.searchParams.get("limit") || "20",
            subId: env.COUPANG_SUB_ID,
            imageSize: "512x512"
          })
        );
      }

      if (url.pathname === "/api/deeplink" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const coupangUrls = Array.isArray(body.coupangUrls)
          ? body.coupangUrls
          : [];

        if (!coupangUrls.length) {
          return json(
            {
              rCode: "1",
              rMessage: "請提供 coupangUrls"
            },
            400
          );
        }

        return coupangPost(
          env,
          "/v1/deeplink",
          { coupangUrls }
        );
      }

      return json(
        {
          ok: false,
          message: "Not Found"
        },
        404
      );

    } catch (err) {
      return json(
        {
          ok: false,
          message: err.message || "Worker error"
        },
        500
      );
    }
  }
};

async function debugCoupang(env) {
  const base = env.COUPANG_API_BASE || DEFAULT_BASE;

  const result = {
    worker: "mama-coupang-api",
    gateway: base,
    apiRoot: API_ROOT,
    hasAccessKey: !!env.COUPANG_ACCESS_KEY,
    hasSecretKey: !!env.COUPANG_SECRET_KEY,
    hasSubId: !!env.COUPANG_SUB_ID,
    market: "TW"
  };

  try {
    const target = base + "/";

    const response = await fetch(target, {
      method: "GET",
      headers: {
        "X-MARKET": "TW",
        "User-Agent": "mama-coupang-api"
      }
    });

    result.gatewayStatus = response.status;
    result.gatewayStatusText = response.statusText;
    result.gatewayContentType =
      response.headers.get("content-type") || "";

    const text = await response.text();

    result.gatewayBodyPreview =
      text.substring(0, 500);

    return json(result);

  } catch (err) {
    result.fetchError = err.message || String(err);
    return json(result, 500);
  }
}

function cleanParams(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  );
}

async function coupangGet(env, path, params = {}) {
  const query = new URLSearchParams(params).toString();

  return callCoupang(
    env,
    "GET",
    API_ROOT + path,
    query,
    null
  );
}

async function coupangPost(env, path, body) {
  return callCoupang(
    env,
    "POST",
    API_ROOT + path,
    "",
    body
  );
}

async function callCoupang(
  env,
  method,
  path,
  query,
  body
) {
  if (
    !env.COUPANG_ACCESS_KEY ||
    !env.COUPANG_SECRET_KEY
  ) {
    return json(
      {
        ok: false,
        message:
          "Cloudflare Worker 尚未設定 COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY"
      },
      500
    );
  }

  const base =
    env.COUPANG_API_BASE || DEFAULT_BASE;

  const now = new Date();

  const signedDate =
    String(now.getUTCFullYear()).slice(2) +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";

  const message =
    signedDate +
    method +
    path +
    query;

  const signature =
    await hmacSha256(
      env.COUPANG_SECRET_KEY,
      message
    );

  const authorization =
    `CEA algorithm=HmacSHA256, access-key=${env.COUPANG_ACCESS_KEY}, signed-date=${signedDate}, signature=${signature}`;

  const target =
    base +
    path +
    (query ? "?" + query : "");

  const headers = {
    "Authorization": authorization,
    "Content-Type":
      "application/json;charset=UTF-8",
    "X-MARKET": "TW",
    "User-Agent": "mama-coupang-api"
  };

  const response = await fetch(
    target,
    {
      method,
      headers,
      body: body
        ? JSON.stringify(body)
        : undefined
    }
  );

  const text =
    await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw: text
    };
  }

  if (!response.ok) {
    return json(
      {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        targetHost:
          new URL(target).host,
        targetPath:
          new URL(target).pathname,
        message:
          data?.rMessage ||
          data?.message ||
          "Coupang API request failed",
        coupang: data
      },
      response.status
    );
  }

  return json(
    data,
    response.status
  );
}

async function hmacSha256(
  secret,
  message
) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const sig =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(message)
    );

  return [
    ...new Uint8Array(sig)
  ]
    .map(
      b =>
        b.toString(16).padStart(2, "0")
    )
    .join("");
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":
      ALLOW_ORIGIN,
    "Access-Control-Allow-Methods":
      "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization"
  };
}

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
        ...corsHeaders()
      }
    }
  );
}
