import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRemoteMetisProxyPath,
  buildRemoteMetisResourceUri,
  buildRemoteUniversePath,
} from './remoteUniversePaths.js';

test('builds explicit remote world-model resource URI', () => {
  const uri = buildRemoteMetisResourceUri('coffee-shop', 'world-model', 'http://localhost:3001');
  assert.equal(uri, 'http://localhost:3001/api/remote-universe/coffee-shop/metis/world-model');
});

test('builds local proxy path for explicit scoped model loading', () => {
  const path = buildRemoteMetisProxyPath('coffee-shop', 'world-model', 'http://localhost:3001');
  assert.equal(
    path,
    '/api/remote-universe/coffee-shop/metis/world-model?baseUrl=http%3A%2F%2Flocalhost%3A3001',
  );
});

test('normalizes legacy foundation scope values to world-model in model route', () => {
  const path = buildRemoteUniversePath('universe_abc123', 'http://localhost:3001', 'origin-type-foundation', 'coffee-shop');
  assert.equal(
    path,
    '/model?universe=universe_abc123&universeSlug=coffee-shop&metisScope=world-model',
  );
});
