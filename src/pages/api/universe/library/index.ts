import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeRemoteUniverseBaseUrl } from '../../../../components/utils/remoteUniverse';
import { buildRemoteFetchError, buildRemoteResponseError, readRemoteJsonLike } from '../../universes/remoteResponse';

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
