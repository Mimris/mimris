import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeRemoteUniverseBaseUrl } from '../../../components/utils/remoteUniverse';
import { buildRemoteResponseError, readRemoteJsonLike } from './remoteResponse';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};

const readUniverseId = (value: string | string[] | undefined) => {
  const resolved = Array.isArray(value) ? value[0] : value;
  return typeof resolved === 'string' ? resolved.trim() : '';
};

const readBaseUrl = (req: NextApiRequest) => {
  const bodyValue = req.body?.baseUrl;
  const queryValue = req.query.baseUrl;
  return normalizeRemoteUniverseBaseUrl(
    typeof bodyValue === 'string' ? bodyValue : Array.isArray(queryValue) ? queryValue[0] : queryValue,
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const universeId = readUniverseId(req.query.id);
  if (!universeId) {
    return res.status(400).json({ error: 'Missing universe id.' });
  }

  try {
    const baseUrl = readBaseUrl(req);
    const endpoint = `${baseUrl}/api/universes/${encodeURIComponent(universeId)}`;

    if (req.method === 'GET') {
      const response = await fetch(endpoint);
      const { payload, text } = await readRemoteJsonLike(response);
      if (!response.ok || !payload) {
        return res.status(response.status || 500).json({
          error: buildRemoteResponseError('Unable to load remote universe.', response, payload, text),
        });
      }
      return res.status(response.status).json(payload);
    }

    if (req.method === 'PUT') {
      const snapshot = req.body?.snapshot;
      if (!snapshot || typeof snapshot !== 'object') {
        return res.status(400).json({ error: 'Missing universe snapshot payload.' });
      }
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snapshot }),
      });
      const { payload, text } = await readRemoteJsonLike(response);
      if (!response.ok || !payload) {
        return res.status(response.status || 500).json({
          error: buildRemoteResponseError('Unable to save remote universe.', response, payload, text),
        });
      }
      return res.status(response.status).json(payload);
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error: any) {
    const message = error?.message || 'Network failure while communicating with remote universe.';
    return res.status(500).json({ error: message });
  }
}
