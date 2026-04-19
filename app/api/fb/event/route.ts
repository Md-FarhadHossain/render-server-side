import { NextResponse } from "next/server";
import bizSdk from "facebook-nodejs-business-sdk";
import { createFacebookEvent } from "@/lib/facebook";
import { logFacebookEvent } from "@/lib/db";

const access_token = process.env.FACEBOOK_ACCESS_TOKEN;
const pixel_id = process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
const test_event_code = process.env.FACEBOOK_TEST_EVENT_CODE;

if (access_token) {
  bizSdk.FacebookAdsApi.init(access_token);
}

export async function POST(req: Request) {
  try {
    if (!access_token || !pixel_id) {
      console.error("Missing FACEBOOK_ACCESS_TOKEN or FACEBOOK_PIXEL_ID");
      return NextResponse.json(
        { error: "Server Configuration Error" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      eventName,
      eventId,
      eventSourceUrl,
      userData = {},
      customData = {},
      fbp,
      fbc,
    } = body;

    // Get client IP and User Agent securely
    const clientIpAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "";
    
    const clientUserAgent = req.headers.get("user-agent") || "";
    const eventTime = Math.floor(Date.now() / 1000);

    const EventRequest = bizSdk.EventRequest;

    const serverEvent = createFacebookEvent(
      eventName,
      eventId,
      eventTime,
      eventSourceUrl,
      clientIpAddress,
      clientUserAgent,
      fbp,
      fbc,
      userData,
      customData
    );

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id).setEvents(
      eventsData
    );

    if (test_event_code) {
      eventRequest.setTestEventCode(test_event_code);
    }

    // Send to Facebook CAPI
    const fbResponse = await eventRequest.execute();
    
    // Log to Turso Database asynchronously
    logFacebookEvent({
      event_name: eventName,
      event_id: eventId,
      event_time: eventTime,
      page_url: eventSourceUrl,
      user_ip: clientIpAddress,
      user_agent: clientUserAgent,
      fbc,
      fbp,
      custom_data: JSON.stringify(customData),
      fb_response: JSON.stringify(fbResponse),
      status: "success",
    });

    return NextResponse.json({ success: true, fbResponse });
  } catch (error: any) {
    console.error("Error sending CAPI event:", error);
    
    // Log failures
    const failedBody = await req.clone().json().catch(() => ({}));
    logFacebookEvent({
      event_name: failedBody.eventName || "unknown",
      event_id: failedBody.eventId || "unknown",
      event_time: Math.floor(Date.now() / 1000),
      status: "failed",
      fb_response: JSON.stringify({ error: error.message }),
    });

    return NextResponse.json(
      { error: "Failed to send CAPI event", details: error.message },
      { status: 500 }
    );
  }
}
