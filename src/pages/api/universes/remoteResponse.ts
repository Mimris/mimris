export const readRemoteJsonLike = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text.trim()) {
    return { payload: null, text, contentType };
  }

  if (contentType.includes('application/json')) {
    try {
      return { payload: JSON.parse(text), text, contentType };
    } catch {
      return { payload: null, text, contentType };
    }
  }

  try {
    return { payload: JSON.parse(text), text, contentType };
  } catch {
    return { payload: null, text, contentType };
  }
};

export const buildRemoteResponseError = (
  fallbackMessage: string,
  response: Response,
  payload: any,
  text: string,
) => {
  if (payload?.error && typeof payload.error === 'string') return payload.error;
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return `${fallbackMessage} Remote server returned HTML (${response.status}). Check the base URL and route.`;
  }
  if (text.trim()) {
    return `${fallbackMessage} ${text.slice(0, 200)}`;
  }
  return fallbackMessage;
};

export const buildRemoteFetchError = (
  fallbackMessage: string,
  error: any,
  baseUrl?: string,
) => {
  const causeCode = error?.cause?.code || error?.code;
  const target = baseUrl ? ` ${baseUrl}` : '';

  if (causeCode === 'ECONNREFUSED') {
    return `${fallbackMessage} Connection refused for${target}. Check that the remote universe server is running.`;
  }

  if (causeCode === 'ENOTFOUND') {
    return `${fallbackMessage} Host not found for${target}. Check the base URL.`;
  }

  if (causeCode === 'ETIMEDOUT') {
    return `${fallbackMessage} Request timed out for${target}.`;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    if (error.message === 'fetch failed' && baseUrl) {
      return `${fallbackMessage} Unable to reach ${baseUrl}. Check that the remote universe server is running.`;
    }
    return error.message;
  }

  return fallbackMessage;
};
