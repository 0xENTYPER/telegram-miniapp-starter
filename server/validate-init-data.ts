const encoder = new TextEncoder();

async function hmac(key: BufferSource, value: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
}

function toHex(value: ArrayBuffer): string {
  return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export interface ValidatedInitData {
  authDate: number;
  queryId: string | null;
  user: unknown;
  startParam: string | null;
}

export async function validateInitData(
  initData: string,
  botToken: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxAgeSeconds = 300
): Promise<ValidatedInitData> {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) throw new Error("initData hash is missing");
  params.delete("hash");
  params.delete("signature");
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = await hmac(encoder.encode("WebAppData"), botToken);
  const expectedHash = toHex(await hmac(secret, dataCheckString));
  if (!safeEqual(receivedHash, expectedHash)) throw new Error("initData signature is invalid");
  const authDate = Number(params.get("auth_date"));
  if (!Number.isInteger(authDate)) throw new Error("auth_date is invalid");
  if (authDate > nowSeconds + 30 || nowSeconds - authDate > maxAgeSeconds) throw new Error("initData is expired");
  const rawUser = params.get("user");
  return {
    authDate,
    queryId: params.get("query_id"),
    user: rawUser ? JSON.parse(rawUser) : null,
    startParam: params.get("start_param")
  };
}

export async function signInitData(fields: Record<string, string>, botToken: string): Promise<string> {
  const params = new URLSearchParams(fields);
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = await hmac(encoder.encode("WebAppData"), botToken);
  params.set("hash", toHex(await hmac(secret, dataCheckString)));
  return params.toString();
}
