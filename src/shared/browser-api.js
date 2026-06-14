export const browserApi = globalThis.chrome;

export function requireBrowserApi(namespace) {
  const api = browserApi?.[namespace];
  if (!api) {
    throw new Error(`Missing chrome.${namespace} API`);
  }
  return api;
}
