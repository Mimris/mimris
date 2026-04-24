import type { NextApiRequest, NextApiResponse } from 'next';
import { buildRemoteFetchError, buildRemoteResponseError, readRemoteJsonLike } from '../../universes/remoteResponse';

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

const readBaseUrl = (req: NextApiRequest) => {
  const bodyValue = req.body?.baseUrl;
  const queryValue = req.query.baseUrl;
  return normalizeRemoteUniverseBaseUrl(
    typeof bodyValue === 'string' ? bodyValue : Array.isArray(queryValue) ? queryValue[0] : queryValue,
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const baseUrl = readBaseUrl(req);
    const response = await fetch(`${baseUrl}/api/universe/library`);
    const { payload, text } = await readRemoteJsonLike(response);
    if (!response.ok || !payload) {
      return res.status(response.status || 500).json({
        error: buildRemoteResponseError('Unable to list remote universes.', response, payload, text),
      });
    }
    return res.status(response.status).json(payload);
  } catch (error: any) {
    return res.status(500).json({
      error: buildRemoteFetchError('Unable to list remote universes.', error, readBaseUrl(req)),
    });
  }
}
