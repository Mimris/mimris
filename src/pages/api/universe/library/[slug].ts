import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeRemoteUniverseBaseUrl } from '../../../../components/utils/remoteUniverse';
import { buildRemoteFetchError, buildRemoteResponseError, readRemoteJsonLike } from '../../universes/remoteResponse';

export const config = {
  api: {
    responseLimit: false,
  },
};

const readBaseUrl = (req: NextApiRequest) => {
  const bodyValue = req.body?.baseUrl;
  const queryValue = req.query.baseUrl;
  return normalizeRemoteUniverseBaseUrl(
    typeof bodyValue === 'string' ? bodyValue : Array.isArray(queryValue) ? queryValue[0] : queryValue,
  );
};

const readSlug = (value: string | string[] | undefined) => {
  const resolved = Array.isArray(value) ? value[0] : value;
  return typeof resolved === 'string' ? resolved.trim() : '';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const slug = readSlug(req.query.slug);
  if (!slug) {
    return res.status(400).json({ error: 'Missing universe slug.' });
  }

  try {
    const baseUrl = readBaseUrl(req);
    const response = await fetch(`${baseUrl}/api/universe/library/${encodeURIComponent(slug)}`);
    const { payload, text } = await readRemoteJsonLike(response);
    if (!response.ok || !payload) {
      return res.status(response.status || 500).json({
        error: buildRemoteResponseError('Unable to load remote universe.', response, payload, text),
      });
    }
    return res.status(response.status).json(payload);
  } catch (error: any) {
    return res.status(500).json({
      error: buildRemoteFetchError('Unable to load remote universe.', error, readBaseUrl(req)),
    });
  }
}
