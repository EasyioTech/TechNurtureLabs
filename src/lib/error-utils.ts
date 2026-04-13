/**
 * Safely extracts error message from API response
 * Handles both old format (string) and new format { error: { code, message, details } }
 */
export function getErrorMessage(error: any, defaultMessage = 'An error occurred'): string {
  if (!error) return defaultMessage;

  // String error
  if (typeof error === 'string') return error;

  // Object with message property (our API format)
  if (error.message && typeof error.message === 'string') return error.message;

  // Try common error properties
  if (error.error) {
    if (typeof error.error === 'string') return error.error;
    if (error.error.message) return error.error.message;
  }

  // Try description (Razorpay format)
  if (error.description) return error.description;

  // Default
  return defaultMessage;
}

/**
 * Extracts error message from fetch response body
 * Handles both { success: false, error: {...} } and legacy formats
 * Also handles cases where HTML 404/500 pages are returned instead of JSON
 */
export function getResponseErrorMessage(data: any, defaultMessage = 'An error occurred'): string {
  if (!data) return defaultMessage;

  // Check if data looks like HTML (error page, 404, etc.)
  if (typeof data === 'string' && (data.includes('<html') || data.includes('<!DOCTYPE'))) {
    // Return default message instead of HTML content
    return defaultMessage;
  }

  // Our new API format
  if (data.error) {
    return getErrorMessage(data.error, defaultMessage);
  }

  // Legacy formats
  if (data.message) return data.message;
  if (data.msg) return data.msg;

  // If object is present but has no recognized error fields,
  // try to stringify it safely (avoid [object Object])
  if (typeof data === 'object') {
    try {
      const str = JSON.stringify(data);
      if (str && str.length < 200) return str;
    } catch (_) {}
  }

  return defaultMessage;
}
