/**
 * Umami analytics helper.
 *
 * Once Umami is enabled (by uncommenting the script tag in layout.tsx
 * and setting data-website-id), call `trackEvent` anywhere to record
 * custom events.
 *
 * Example events you might want to track:
 *   trackEvent("qr_generated")
 *   trackEvent("qr_downloaded", { format: "png" })
 *   trackEvent("qr_downloaded", { format: "svg" })
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
    };
  }
}

export function trackEvent(
  event: string,
  data?: Record<string, string | number>
) {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(event, data);
  }
}
