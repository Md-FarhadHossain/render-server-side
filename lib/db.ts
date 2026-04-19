import { createClient } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

// Throw error early during initialization if env vars are missing
if (!dbUrl) {
  console.warn("Missing TURSO_DATABASE_URL environment variable.");
}

export const db = createClient({
  url: dbUrl || "libsql://default",
  authToken: dbToken,
});

/**
 * Log a Facebook CAPI event to Turso
 */
export async function logFacebookEvent(data: {
  event_name: string;
  event_id: string;
  event_time: number;
  page_url?: string;
  user_ip?: string;
  user_agent?: string;
  fbc?: string;
  fbp?: string;
  custom_data?: string;
  fb_response?: string;
  status: "success" | "failed" | "pending";
}) {
  try {
    if (!dbUrl) return; // Skip if db not configured

    await db.execute({
      sql: `INSERT INTO fb_events (
        event_name, event_id, event_time, page_url, user_ip, user_agent, 
        fbc, fbp, custom_data, fb_response, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.event_name,
        data.event_id,
        data.event_time,
        data.page_url || null,
        data.user_ip || null,
        data.user_agent || null,
        data.fbc || null,
        data.fbp || null,
        data.custom_data || null,
        data.fb_response || null,
        data.status,
      ],
    });
  } catch (error) {
    console.error("Failed to log event to Turso:", error);
  }
}
