export const RELATIVE_TIME_REFRESH_MS = 60_000;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatHourMinute(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function formatRelativeTime(timestamp, now = Date.now()) {
  const date = toDate(timestamp);
  const current = toDate(now);

  if (!date || !current) {
    return "时间未知";
  }

  const diff = current.getTime() - date.getTime();
  if (diff >= 0 && diff < MINUTE_MS) {
    return "刚刚";
  }

  if (diff >= MINUTE_MS && diff < 60 * MINUTE_MS) {
    return `${Math.floor(diff / MINUTE_MS)} 分钟前`;
  }

  if (isSameDay(date, current)) {
    return `今天 ${formatHourMinute(date)}`;
  }

  const yesterday = new Date(current);
  yesterday.setDate(current.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `昨天 ${formatHourMinute(date)}`;
  }

  if (diff >= 0 && diff < 365 * DAY_MS) {
    return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${formatHourMinute(date)}`;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${formatHourMinute(date)}`;
}

export function getFullTimeText(timestamp) {
  const date = toDate(timestamp);
  if (!date) {
    return "";
  }

  return [
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    `${formatHourMinute(date)}:${pad2(date.getSeconds())}`
  ].join(" ");
}

export function createRelativeTimeTicker(callback, scheduler = globalThis) {
  const intervalId = scheduler.setInterval(callback, RELATIVE_TIME_REFRESH_MS);
  return () => scheduler.clearInterval(intervalId);
}
