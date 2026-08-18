import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { buildRemoteMetisResourceUri, normalizeRemoteUniverseBaseUrl } from '../../../../components/utils/remoteUniverse';
import { buildRemoteFetchError, buildRemoteResponseError, readRemoteJsonLike } from '../../universes/remoteResponse';

export const config = {
  api: {
    responseLimit: false,
  },
};

const readSingleQueryValue = (value: string | string[] | undefined) => {
  const resolved = Array.isArray(value) ? value[0] : value;
  return typeof resolved === 'string' ? resolved.trim() : '';
};

const readBaseUrl = (req: NextApiRequest) => {
  const bodyValue = req.body?.baseUrl;
  const queryValue = req.query.baseUrl;
  return normalizeRemoteUniverseBaseUrl(
    typeof bodyValue === 'string' ? bodyValue : readSingleQueryValue(queryValue),
  );
};

const readRawBaseUrl = (req: NextApiRequest) => {
  const bodyValue = req.body?.baseUrl;
  const queryValue = req.query.baseUrl;
  return typeof bodyValue === 'string' ? bodyValue : readSingleQueryValue(queryValue);
};

const buildScopedRemoteMetisUri = (req: NextApiRequest, universeSlug: string, scope: string, baseUrl: string) => {
  const url = new URL(buildRemoteMetisResourceUri(universeSlug, scope, baseUrl));
  [
    'currentMetamodelRef',
    'currentModelRef',
    'currentModelviewRef',
    'currentTargetMetamodelRef',
    'targetMetamodelRefs',
    'currentTargetModelRef',
    'currentTargetModelviewRef',
    'initialModelviews',
    'modelScope',
    'workItemId',
    'saveTarget',
    'revision',
    'workspaceAuthority',
  ].forEach((key) => {
    const value = readSingleQueryValue(req.query[key]);
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

const asRecord = (value: any) => (value && typeof value === 'object' ? value : {});

const isMetisRecord = (value: any) => {
  const record = asRecord(value);
  return Array.isArray(record.models) || Array.isArray(record.metamodels);
};

const slugCandidates = (slug: string) => {
  const normalized = slug.trim().toLowerCase();
  const candidates = [normalized];
  if (normalized.endsWith('-generic')) {
    candidates.push(normalized.replace(/-generic$/, ''));
  }
  return candidates.filter(Boolean);
};

const shareReferencesSlug = (snapshot: any, candidates: string[], scope: string) => {
  const values = [
    snapshot?.phSource,
    snapshot?.phFocus?.focusProj?.file,
    snapshot?.phUser?.__workspaceUniverse?.remoteModelUri,
    snapshot?.phUser?.__workspaceUniverse?.universeSlug,
  ]
    .filter((value) => typeof value === 'string')
    .map((value) => value.toLowerCase());

  const normalizedScope = scope.trim().toLowerCase();
  const matchesScope = !normalizedScope || values.some((value) =>
    value.includes(`/metis/${normalizedScope}`) ||
    value.includes(`/metis/${encodeURIComponent(normalizedScope)}`) ||
    value === normalizedScope,
  );

  if (!matchesScope) return false;

  return candidates.some((candidate) =>
    values.some((value) =>
      value === candidate ||
      value.includes(`/remote-universe/${candidate}/`) ||
      value.includes(`/remote-universe/${encodeURIComponent(candidate)}/`),
    ),
  );
};

const readLocalShareMetis = async (universeSlug: string, scope: string) => {
  const sharesDir = path.join(process.cwd(), 'data', 'shares');
  const candidates = slugCandidates(universeSlug);
  const files = await fs.readdir(sharesDir).catch(() => []);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const sharePath = path.join(sharesDir, file);
    const raw = await fs.readFile(sharePath, 'utf8').catch(() => '');
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const snapshot = parsed?.snapshot || parsed;
      if (!shareReferencesSlug(snapshot, candidates, scope)) continue;

      const metis = snapshot?.phData?.metis;
      if (isMetisRecord(metis)) {
        return metis;
      }
    } catch {
      // Ignore malformed local share files; the remote error path will report the real failure.
    }
  }

  return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const universeSlug = readSingleQueryValue(req.query.universeSlug);
  if (!universeSlug) {
    return res.status(400).json({ error: 'Missing universe slug.' });
  }

  try {
    const baseUrl = readBaseUrl(req);
    const scope = readSingleQueryValue(req.query.scope);
    const remoteUri = buildScopedRemoteMetisUri(req, universeSlug, scope, baseUrl);
    const response = await fetch(remoteUri, req.method === 'PUT'
      ? {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      }
      : undefined);
    const { payload, text } = await readRemoteJsonLike(response);

    if (!response.ok || !payload) {
      return res.status(response.status || 500).json({
        error: buildRemoteResponseError('Unable to load remote model resource.', response, payload, text),
      });
    }

    return res.status(response.status).json({ payload });
  } catch (error: any) {
    if (req.method === 'PUT') {
      return res.status(500).json({
        error: buildRemoteFetchError('Unable to save remote model resource.', error, readRawBaseUrl(req)),
      });
    }

    const scope = readSingleQueryValue(req.query.scope);
    const localMetis = await readLocalShareMetis(universeSlug, scope);
    if (localMetis) {
      return res.status(200).json({ payload: localMetis });
    }

    return res.status(500).json({
      error: buildRemoteFetchError('Unable to load remote model resource.', error, readRawBaseUrl(req)),
    });
  }
}
