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
 */
export function getResponseErrorMessage(data: any, defaultMessage = 'An error occurred'): string {
  if (!data) return defaultMessage;

  // Our new API format
  if (data.error) {
    return getErrorMessage(data.error, defaultMessage);
  }

  // Legacy formats
  if (data.message) return data.message;
  if (data.msg) return data.msg;

  return defaultMessage;
}
