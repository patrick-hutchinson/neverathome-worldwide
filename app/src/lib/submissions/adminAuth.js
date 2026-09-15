import crypto from "crypto";

const cookieName = "nah_admin_session";
const sessionMaxAge = 60 * 60 * 8;

function getAdminPassword() {
  return process.env.ADMIN_SUBMISSIONS_PASSWORD || process.env.ADMIN_PASSWORD || "";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

function getExpectedToken() {
  const secret = getSessionSecret();
  if (!secret) return "";

  return crypto.createHmac("sha256", secret).update("submissions-admin").digest("hex");
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) return [cookie, ""];

        return [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))];
      }),
  );
}

function timingSafeEqual(left = "", right = "") {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export function isValidAdminPassword(password = "") {
  const adminPassword = getAdminPassword();
  if (!adminPassword) return false;

  return timingSafeEqual(password, adminPassword);
}

export function isAdminRequest(request) {
  const token = parseCookies(request.headers.cookie || "")[cookieName];
  const expectedToken = getExpectedToken();

  return Boolean(token && expectedToken && timingSafeEqual(token, expectedToken));
}

export function setAdminSessionCookie(response) {
  const token = getExpectedToken();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  response.setHeader(
    "Set-Cookie",
    `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAge}${secure}`,
  );
}

export function clearAdminSessionCookie(response) {
  response.setHeader("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
