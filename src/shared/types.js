/**
 * @typedef {Object} TabSnapshot
 * @property {number | undefined} tabId
 * @property {number | undefined} windowId
 * @property {string} title
 * @property {string} url
 * @property {string} domain
 * @property {boolean} pinned
 */

/**
 * @typedef {Object} TabActivity
 * @property {string} id
 * @property {"opened" | "activated" | "closed"} type
 * @property {number} timestamp
 * @property {TabSnapshot} tab
 */

/**
 * @typedef {Object} TabTrailPreferences
 * @property {Record<string, string>} manualCategories
 * @property {string[]} pinnedKeys
 * @property {Record<string, number[]>} previewOrders
 * @property {"current-window" | "all-windows"} defaultScope
 */
export {};
