export const readJsonResponse = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return { payload: null, text };
  try {
    return { payload: JSON.parse(text), text };
  } catch {
    return { payload: null, text };
  }
};

export const readJsonResponseError = (
  response: Response,
  payload: any,
  text: string,
  fallbackMessage: string,
) => {
  if (payload?.error && typeof payload.error === 'string') return payload.error;
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return `${fallbackMessage} The server returned HTML (${response.status}).`;
  }
  if (text.trim()) return `${fallbackMessage} ${text.slice(0, 200)}`;
  return fallbackMessage;
};
