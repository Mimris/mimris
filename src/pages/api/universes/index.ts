import type { NextApiRequest, NextApiResponse } from 'next';
import { buildRemoteResponseError, readRemoteJsonLike } from './remoteResponse';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const readBaseUrl = (req: NextApiRequest) => {
  const bodyValue = req.body?.baseUrl;
  const queryValue = req.query.baseUrl;
  return normalizeRemoteUniverseBaseUrl(
    typeof bodyValue === 'string' ? bodyValue : Array.isArray(queryValue) ? queryValue[0] : queryValue,
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const snapshot = req.body?.snapshot;
  if (snapshot != null && typeof snapshot !== 'object') {
    return res.status(400).json({ error: 'Invalid universe snapshot payload.' });
  }

  try {
    const baseUrl = readBaseUrl(req);
    const response = await fetch(`${baseUrl}/api/universes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot ? { snapshot } : {}),
    });
    const { payload, text } = await readRemoteJsonLike(response);
    if (!response.ok || !payload) {
      return res.status(response.status || 500).json({
        error: buildRemoteResponseError('Unable to create remote universe.', response, payload, text),
      });
    }
    return res.status(response.status).json(payload);
  } catch (error: any) {
    const message = error?.message || 'Network failure while creating remote universe.';
    return res.status(500).json({ error: message });
  }
}
const DEFAULT_REMOTE_UNIVERSE_BASE_URL =
  process.env.NEXT_PUBLIC_SHARED_UNIVERSE_BASE_URL || 'http://localhost:3001';

const normalizeRemoteUniverseBaseUrl = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const baseUrl = typeof rawValue === 'string' && rawValue.trim() ? rawValue.trim() : DEFAULT_REMOTE_UNIVERSE_BASE_URL;
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error('Invalid remote universe base URL.');
  }
  return baseUrl.replace(/\/+$/, '');
};
