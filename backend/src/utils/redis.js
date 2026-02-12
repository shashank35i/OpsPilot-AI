const Redis = require("ioredis");

let client = null;

function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL || "";
  if (!url) return null;

  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on("error", (err) => {
    console.error("Redis error:", err?.message || err);
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  return client;
}

async function cacheGet(key) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 30) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // no-op cache fallback
  }
}

async function cacheDel(keys) {
  const redis = getRedis();
  if (!redis || !keys?.length) return;
  try {
    await redis.del(keys);
  } catch {
    // no-op cache fallback
  }
}

module.exports = { getRedis, cacheGet, cacheSet, cacheDel };
