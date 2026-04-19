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
        const fbc = Cookies.get("_fbc") || window.location.search.includes("fbclid=") 
          ? `fb.1.${Date.now()}.${new URLSearchParams(window.location.search).get("fbclid")}`
          : undefined;

        // 1. Fire Browser Event (Pixel)
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq("track", eventName, customData, { eventID: eventId });
        } else {
          console.warn("Facebook Pixel (fbq) not found on window");
        }

        // 2. Fire Server Event (CAPI)
        await fetch("/api/fb/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
