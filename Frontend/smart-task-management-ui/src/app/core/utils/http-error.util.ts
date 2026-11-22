
import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

export function getHttpErrorMessage(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.'
): string {

  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error
      ? error.message
      : fallbackMessage;
  }

  // Network or connection error
  if (error.status === 0) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  const response = error.error;

  // Backend returned a plain-text error
  if (typeof response === 'string' && response.trim()) {
    return response;
  }

  // Backend returned JSON
  if (response && typeof response === 'object') {
    const apiError = response as ApiErrorResponse;

    if (apiError.message?.trim()) {
      return apiError.message;
    }

    if (apiError.title?.trim()) {
      return apiError.title;
    }

    // Handle validation errors
    if (apiError.errors) {
      const validationMessages = Object.values(apiError.errors)
        .flat()
        .filter(Boolean);

      if (validationMessages.length > 0) {
        return validationMessages.join('\n');
      }
    }
  }

  // Fallback for common HTTP errors
  switch (error.status) {
    case 400:
      return 'Invalid request. Please check your input.';

    case 401:
      return 'Your session has expired. Please log in again.';

    case 403:
      return 'You do not have permission to perform this action.';

    case 404:
      return 'The requested resource was not found.';

    case 409:
      return 'This operation conflicts with existing data.';

    case 500:
      return 'An internal server error occurred. Please try again later.';

    default:
      return fallbackMessage;
  }
}
