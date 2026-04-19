"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

export const useFacebookTrack = () => {
  const track = useCallback(
    async (
      eventName: string,
      customData: Record<string, any> = {},
      userData: { email?: string; phone?: string; external_id?: string } = {}
    ) => {
      try {
        const eventId = uuidv4();
        const eventSourceUrl = window.location.href;

        const fbp = Cookies.get("_fbp");

        // Fix: parentheses needed around the || so it only applies when no fbclid in URL
        const fbclidParam = new URLSearchParams(window.location.search).get("fbclid");
        const fbc = Cookies.get("_fbc") || (fbclidParam ? `fb.1.${Date.now()}.${fbclidParam}` : undefined);

        // 1. Fire Browser Event (Pixel)
        // Because the Facebook snippet creates window.fbq synchronously as a queue,
        // this will never fail even if fbevents.js is still downloading!
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq("track", eventName, customData, { eventID: eventId });
          console.log(`[FB Pixel] Browser event queued: ${eventName} (eventID: ${eventId})`);
        } else {
          console.warn(`[FB Pixel] fbq not available — browser event skipped for: ${eventName}`);
        }

        // 2. Fire Server Event (CAPI) simultaneously
        await fetch("/api/fb/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName,
            eventId,
            eventSourceUrl,
            userData,
            customData,
            fbp,
            fbc,
          }),
        });

      } catch (error) {
        console.error("Facebook tracking error:", error);
      }
    },
    []
  );

  return { track };
};
