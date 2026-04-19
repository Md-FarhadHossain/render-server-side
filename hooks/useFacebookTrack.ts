"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

/**
 * Waits until the Facebook Pixel (fbq) is fully initialized.
 * The FacebookPixel component dispatches a 'fbqReady' event on window when done.
 * If fbq is already loaded (e.g. event fired before we registered), resolve immediately.
 */
function waitForFbq(): Promise<void> {
  return new Promise((resolve) => {
    const win = window as any;
    // Already loaded (fbevents.js has run and called fbq('init', ...))
    if (win.fbq && typeof win.fbq.callMethod === "function") {
      resolve();
      return;
    }
    // Otherwise wait for our custom signal from FacebookPixel.tsx
    const handler = () => {
      window.removeEventListener("fbqReady", handler);
      resolve();
    };
    window.addEventListener("fbqReady", handler);
    // Safety timeout: don't wait longer than 5 seconds (e.g. if pixel is blocked)
    setTimeout(() => {
      window.removeEventListener("fbqReady", handler);
      resolve();
    }, 5000);
  });
}

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

        // 1. Wait for the pixel script to be fully ready, THEN fire browser event
        await waitForFbq();
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq("track", eventName, customData, { eventID: eventId });
          console.log(`[FB Pixel] Browser event fired: ${eventName} (eventID: ${eventId})`);
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
