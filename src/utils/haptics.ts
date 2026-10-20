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

/**
 * Short distinct vibration buzz for Task Completion notifications
 */
export function vibrateTaskCompletion() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Distinct, short buzz pattern for task completion: 90ms buzz, 40ms pause, 130ms buzz
      navigator.vibrate([90, 40, 130]);
    } catch {
      // ignore
    }
  }
}
