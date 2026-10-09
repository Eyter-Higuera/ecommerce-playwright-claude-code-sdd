import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';

// Vitest setup file (Spec 000, RF-6 / constitution #5): unit tests must never reach the network,
// localhost included. Every client entry point of node:http, node:https and the global fetch is
// replaced with a function that throws, naming the URL, so an unmocked dependency fails loudly
// instead of silently calling a real service. Mocks installed by a test (vi.stubGlobal, vi.mock)
// take precedence over this guard.

const GUARD_PREFIX = 'Network access is disabled in unit tests:';

type RequestTarget = string | URL | http.RequestOptions | undefined;

function describeTarget(target: RequestTarget, defaultProtocol: string): string {
  if (typeof target === 'string') return target;
  if (target instanceof URL) return target.href;
  if (target === undefined) return '<unknown url>';
  const protocol = target.protocol ?? defaultProtocol;
  const host = target.hostname ?? target.host ?? 'localhost';
  const port = target.port !== undefined && target.port !== null ? `:${String(target.port)}` : '';
  return `${protocol}//${host}${port}${target.path ?? '/'}`;
}

function networkError(url: string): Error {
  return new Error(`${GUARD_PREFIX} ${url}`);
}

function blockModule(module: typeof http | typeof https, defaultProtocol: string): void {
  const blocked = (target?: RequestTarget): never => {
    throw networkError(describeTarget(target, defaultProtocol));
  };
  // The guard accepts every overload of request/get (URL string, URL or options) and never returns.
  module.request = blocked;
  module.get = blocked;
}

function fetchTargetUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

blockModule(http, 'http:');
blockModule(https, 'https:');
// Keep named ESM imports (`import { request } from 'node:http'`) in sync with the patched exports.
syncBuiltinESMExports();

globalThis.fetch = (input: string | URL | Request): Promise<Response> =>
  Promise.reject(networkError(fetchTargetUrl(input)));
