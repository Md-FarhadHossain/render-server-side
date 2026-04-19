import { NextResponse } from "next/server";
import bizSdk from "facebook-nodejs-business-sdk";
import { createFacebookEvent } from "@/lib/facebook";

const access_token = process.env.FACEBOOK_ACCESS_TOKEN;
const pixel_id = process.env.FACEBOOK_PIXEL_ID;
const test_event_code = process.env.FACEBOOK_TEST_EVENT_CODE;

if (access_token) {
  bizSdk.FacebookAdsApi.init(access_token);
}

export async function GET(req: Request) {
  try {
    if (!access_token || !pixel_id) {
      return NextResponse.json(
        { error: "Missing FACEBOOK_ACCESS_TOKEN or FACEBOOK_PIXEL_ID" },
        { status: 500 }
      );
    }

    const EventRequest = bizSdk.EventRequest;

    // A fake test event
    const fakeEventId = `test_event_${Math.random().toString(36).substring(2, 9)}`;
    const eventTime = Math.floor(Date.now() / 1000);
    const clientIpAddress = req.headers.get("x-real-ip") || "127.0.0.1";
    const clientUserAgent = req.headers.get("user-agent") || "Mozilla/5.0";

    const serverEvent = createFacebookEvent(
      "TestEvent",
      fakeEventId,
      eventTime,
      "https://example.com/test",
      clientIpAddress,
      clientUserAgent,
      undefined, // fbp
      undefined, // fbc
      { email: "test@example.com" }, // mock user data
      { value: 9.99, currency: "USD" } // mock custom data
    );

    const eventRequest = new EventRequest(access_token, pixel_id).setEvents([
      serverEvent,
    ]);

    if (test_event_code) {
      eventRequest.setTestEventCode(test_event_code);
    }

    const response = await eventRequest.execute();

    return NextResponse.json({
      success: true,
      message: "Test event fired successfully check your FB Events Manager",
      test_event_code,
      response,
    });
  } catch (error: any) {
    console.error("Test CAPI Error:", error);
    return NextResponse.json(
      { error: "Failed to fire test event", details: error.message },
      { status: 500 }
    );
  }
}
