"use client";

import Script from "next/script";

type FacebookPixelProps = {
  pixelId: string;
};

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
  return (
    <>
      {/* Step 1: Immediately stub the fbq function so queued calls before the
          script loads are not lost. This runs synchronously on the page. */}
      <Script id="fb-pixel-stub" strategy="beforeInteractive">
        {`
          window.fbq = window.fbq || function() {
            (window.fbq.q = window.fbq.q || []).push(arguments);
          };
          window._fbq = window._fbq || window.fbq;
          window.fbq.loaded = true;
          window.fbq.version = '2.0';
          window.fbq.queue = window.fbq.q || [];
        `}
      </Script>

      {/* Step 2: Load the real fbevents.js. Once it loads it will flush the
          queued calls above, then we dispatch 'fbqReady' so the hook knows
          the pixel is live and any pending browser events can fire. */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/fbevents.js"
        onLoad={() => {
          if (!pixelId) {
            console.error("❌ CRITICAL ERROR: NEXT_PUBLIC_FACEBOOK_PIXEL_ID is missing! Browser Pixel is DISABLED.");
            return;
          }
          const win = window as any;
          win.fbq('init', pixelId);
          win.fbq('track', 'PageView');
          // Signal to useFacebookTrack that the pixel is fully ready
          win.dispatchEvent(new Event('fbqReady'));
        }}
      />
      
      {!pixelId && (
        <div style={{ padding: "10px", background: "red", color: "white", position: "fixed", bottom: 0, left: 0, zIndex: 9999 }}>
          Error: FB Pixel ID missing! Check Render Environment Variables.
        </div>
      )}

      {pixelId && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}
    </>
  );
}
