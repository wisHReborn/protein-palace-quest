/**
 * Cross-browser & iPadOS/iOS Safari Compatible Fullscreen Helper
 */

export function isFullscreenActive(): boolean {
  if (typeof document === "undefined") return false;

  const doc = document as any;
  const isNativeFs = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  const isIosFs = doc.documentElement.classList.contains("ios-fullscreen-active");
  return isNativeFs || isIosFs;
}

export async function toggleFullscreen(
  onStateChange?: (active: boolean) => void
): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const doc = document as any;
  const elem = doc.documentElement as any;

  const isCurrentActive = isFullscreenActive();

  if (!isCurrentActive) {
    // Attempt native fullscreen with all vendor prefixes (Chrome, Safari, iPadOS, Firefox, Edge)
    let nativeSuccess = false;

    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        nativeSuccess = true;
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
        nativeSuccess = true;
      } else if (elem.webkitRequestFullScreen) {
        await elem.webkitRequestFullScreen();
        nativeSuccess = true;
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
        nativeSuccess = true;
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
        nativeSuccess = true;
      }
    } catch (err) {
      // Native API failed (e.g. iPadOS Safari policy restriction)
      nativeSuccess = false;
    }

    if (nativeSuccess && isFullscreenActive()) {
      onStateChange?.(true);
      return true;
    }

    // iPadOS / iOS / Safari Fallback (CSS Fullscreen Container)
    doc.documentElement.classList.add("ios-fullscreen-active");
    doc.body.classList.add("ios-fullscreen-active");
    try {
      window.scrollTo(0, 1);
    } catch {}

    onStateChange?.(true);
    return true;
  } else {
    // Exit fullscreen
    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.webkitCancelFullScreen) {
        await doc.webkitCancelFullScreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    } catch {}

    // Always clean up iOS fallback
    doc.documentElement.classList.remove("ios-fullscreen-active");
    doc.body.classList.remove("ios-fullscreen-active");
    onStateChange?.(false);
    return false;
  }
}
