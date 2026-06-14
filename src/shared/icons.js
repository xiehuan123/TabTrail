const ICONS = {
  panel: [
    '<rect x="3" y="4" width="18" height="16" rx="2"></rect>',
    '<path d="M9 4v16"></path>',
    '<path d="M13 8h4"></path>',
    '<path d="M13 12h4"></path>'
  ],
  clock: [
    '<circle cx="12" cy="12" r="9"></circle>',
    '<path d="M12 7v5l3 2"></path>'
  ],
  search: [
    '<circle cx="11" cy="11" r="7"></circle>',
    '<path d="m20 20-3.5-3.5"></path>'
  ],
  close: [
    '<path d="M18 6 6 18"></path>',
    '<path d="m6 6 12 12"></path>'
  ],
  sort: [
    '<path d="M7 7h10"></path>',
    '<path d="M7 12h7"></path>',
    '<path d="M7 17h4"></path>'
  ],
  restore: [
    '<path d="M3 12a9 9 0 1 0 3-6.7"></path>',
    '<path d="M3 4v6h6"></path>'
  ],
  focus: [
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path>',
    '<path d="M16 3h3a2 2 0 0 1 2 2v3"></path>',
    '<path d="M8 21H5a2 2 0 0 1-2-2v-3"></path>',
    '<path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>',
    '<circle cx="12" cy="12" r="3"></circle>'
  ],
  warning: [
    '<path d="m12 3 10 18H2L12 3Z"></path>',
    '<path d="M12 9v4"></path>',
    '<path d="M12 17h.01"></path>'
  ]
};

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export const ICON_NAMES = Object.freeze(Object.keys(ICONS));

export function renderIcon(name, options = {}) {
  const paths = ICONS[name];
  if (!paths) {
    throw new Error(`Unknown icon: ${name}`);
  }

  const labelAttribute = options.label
    ? `role="img" aria-label="${escapeAttribute(options.label)}"`
    : 'aria-hidden="true"';
  const className = options.className ? ` ${escapeAttribute(options.className)}` : "";

  return `<svg class="tt-icon${className}" ${labelAttribute} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths.join("")}</svg>`;
}
