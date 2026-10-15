/**
 * Haptic vibration feedback for mobile devices
 */

export function vibrateSuccess() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Short double pulse for success
      navigator.vibrate([70, 40, 90]);
    } catch {
      // Haptics not allowed or unsupported
    }
  }
}

export function vibrateWarning() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Triple pulsing vibration
      navigator.vibrate([150, 70, 150, 70, 180]);
    } catch {
      // ignore
    }
  }
}

export function vibrateError() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Long sustained buzz
      navigator.vibrate([400]);
    } catch {
      // ignore
    }
  }
}
