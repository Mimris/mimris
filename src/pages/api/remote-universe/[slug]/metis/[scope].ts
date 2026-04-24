import type { NextApiRequest, NextApiResponse } from 'next';
import { buildRemoteFetchError, buildRemoteResponseError, readRemoteJsonLike } from '../../../universes/remoteResponse';

export const config = {
  api: {
    responseLimit: false,
  },
};

const readValue = (value: string | string[] | undefined) => {
  const resolved = Array.isArray(value) ? value[0] : value;
  return typeof resolved === 'string' ? resolved.trim() : '';
};

const normalizeSupportedMetisScope = (scope: string) => {
  const value = (scope || '').trim();
  if (!value) return '';
  if (value === 'world-model' || value === 'worldModel') return 'world-model';
  if (value === 'current' || value === 'next') return 'world-model';
  if (
    value === 'origin-type-foundation' ||
    value === 'origin-template-foundation' ||
    value === 'type-definition' ||
    value === 'typeDefinition' ||
    value === 'template' ||
    value === 'templateDefinition'
  ) {
    return '';
  }
  return '';
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

  const slug = readValue(req.query.slug);
  const rawScope = readValue(req.query.scope);
  const scope = normalizeSupportedMetisScope(rawScope);
  if (!slug) {
    return res.status(400).json({ error: 'Missing universe slug.' });
  }
  if (!rawScope) {
    return res.status(400).json({ error: 'Missing metis scope.' });
  }
  if (!scope) {
    return res.status(400).json({
      error: `Unsupported metis scope '${rawScope}'. Supported scopes: world-model. Shared models must be loaded from separate universes.`,
    });
  }

  try {
    const baseUrl = readBaseUrl(req);
    const endpoint = buildRemoteMetisResourceUri(slug, scope, baseUrl);
    const response = await fetch(endpoint);
    const { payload, text } = await readRemoteJsonLike(response);
    if (!response.ok || !payload) {
      try {
        const fallbackResponse = await fetch(`${baseUrl}/api/universe/library/${encodeURIComponent(slug)}`);
        const fallback = await readRemoteJsonLike(fallbackResponse);
        if (fallbackResponse.ok && fallback.payload) {
          return res.status(200).json({
            uri: endpoint,
            payload: setActiveMetisScope(fallback.payload, scope),
            fallback: {
              source: `${baseUrl}/api/universe/library/${encodeURIComponent(slug)}`,
              reason: buildRemoteResponseError(`Unable to load remote model resource ${scope}.`, response, payload, text),
            },
          });
        }
      } catch {
        // Preserve the original scoped-endpoint error below when the fallback request also fails.
      }
      return res.status(response.status || 500).json({
        error: buildRemoteResponseError(`Unable to load remote model resource ${scope}.`, response, payload, text),
        uri: endpoint,
      });
    }
    return res.status(response.status).json({
      uri: endpoint,
      payload,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: buildRemoteFetchError(`Unable to load remote model resource ${scope}.`, error, readBaseUrl(req)),
    });
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

const buildRemoteMetisResourceUri = (slug: string, scope: string, baseUrl: string) =>
  `${normalizeRemoteUniverseBaseUrl(baseUrl)}/api/remote-universe/${encodeURIComponent(slug)}/metis/${encodeURIComponent(scope)}`;

const setActiveMetisScope = (snapshot: any, scope: string) => {
  const record = snapshot && typeof snapshot === 'object' ? snapshot : {};
  return {
    ...record,
    workspace: {
      ...((record as any).workspace && typeof (record as any).workspace === 'object' ? (record as any).workspace : {}),
      activeMetisScope: scope,
    },
  };
};
