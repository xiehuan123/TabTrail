export const STORAGE_KEYS = Object.freeze({
  activity: "tabtrail.activity",
  preferences: "tabtrail.preferences"
});

export const LIMITS = Object.freeze({
  recentActivity: 100,
  popupRecentActive: 8,
  popupRecentClosed: 8,
  bulkCloseConfirmThreshold: 3
});

export const ACTIVITY_TYPES = Object.freeze({
  opened: "opened",
  activated: "activated",
  closed: "closed"
});
