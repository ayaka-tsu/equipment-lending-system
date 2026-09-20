/**
 * 日付まわりのユーティリティ。
 *
 * 日付の判定はすべて日本時間（Asia/Tokyo）で行う（BR-18 / NFR-E-04）。
 * サーバーのタイムゾーン設定（Vercel は UTC）に依存しないよう、
 * ここでは必ずタイムゾーンを指定して計算する。
 */

const JST_TIME_ZONE = "Asia/Tokyo";

const jstDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 任意の日時を、日本時間の暦日（YYYY-MM-DD）にする */
export function toJstDateString(date: Date): string {
  return jstDateFormatter.format(date);
}

/** 日本時間での「今日」（YYYY-MM-DD） */
export function todayInJst(now: Date = new Date()): string {
  return toJstDateString(now);
}

/** YYYY-MM-DD に日数を足す（日本時間の暦日として扱う） */
export function addDaysToDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/** YYYY-MM-DD の差（a - b）を日数で返す */
export function diffInDays(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [year, month, day] = s.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
}

/** 延滞かどうか（BR-06）。貸出中で、返却予定日が今日より前 */
export function isOverdue(status: string, dueDate: Date | string, now: Date = new Date()): boolean {
  if (status !== "lent") return false;
  const due = typeof dueDate === "string" ? dueDate : toJstDateString(dueDate);
  return diffInDays(due, todayInJst(now)) < 0;
}

/** 返却期限間近かどうか（BR-15）。貸出中で、返却予定日が今日から3日後まで */
export function isDueSoon(status: string, dueDate: Date | string, now: Date = new Date()): boolean {
  if (status !== "lent") return false;
  const due = typeof dueDate === "string" ? dueDate : toJstDateString(dueDate);
  const diff = diffInDays(due, todayInJst(now));
  return diff >= 0 && diff <= 3;
}

/** 返却予定日として指定できるか（BR-05）。申請日の翌日から30日後まで */
export function isSelectableDueDate(dueDate: string, now: Date = new Date()): boolean {
  const diff = diffInDays(dueDate, todayInJst(now));
  return diff >= 1 && diff <= 30;
}
