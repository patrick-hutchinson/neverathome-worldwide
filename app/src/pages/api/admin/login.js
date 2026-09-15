import {
  isAdminPasswordConfigured,
  isValidAdminPassword,
  setAdminSessionCookie,
} from "@/lib/submissions/adminAuth";

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  if (!isAdminPasswordConfigured()) {
    return response.status(500).json({ error: "Admin password is not configured." });
  }

  if (!isValidAdminPassword(request.body?.password || "")) {
    return response.status(401).json({ error: "Invalid password." });
  }

  setAdminSessionCookie(response);
  return response.status(200).json({ ok: true });
}
