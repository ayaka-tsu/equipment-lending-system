import { describe, expect, it } from "vitest";

import {
  addDaysToDateString,
  diffInDays,
  isDueSoon,
  isOverdue,
  isSelectableDueDate,
  todayInJst,
  toJstDateString,
} from "./date";

/**
 * 日付の判定は日本時間で行う（BR-18 / NFR-E-04）。
 * このテストは TZ=UTC で実行しても同じ結果になる必要がある。
 */
describe("日本時間での日付", () => {
  it("UTC の 15:00 は、日本時間では翌日になる", () => {
    expect(toJstDateString(new Date("2026-09-19T15:00:00Z"))).toBe("2026-09-20");
    expect(toJstDateString(new Date("2026-09-19T14:59:59Z"))).toBe("2026-09-19");
  });

  it("todayInJst は YYYY-MM-DD を返す", () => {
    expect(todayInJst(new Date("2026-09-19T23:30:00Z"))).toBe("2026-09-20");
  });

  it("日付の加算と差分", () => {
    expect(addDaysToDateString("2026-09-30", 1)).toBe("2026-10-01");
    expect(diffInDays("2026-10-01", "2026-09-30")).toBe(1);
    expect(diffInDays("2026-09-01", "2026-09-19")).toBe(-18);
  });
});

describe("延滞の判定（BR-06）", () => {
  const now = new Date("2026-09-19T01:00:00Z"); // 日本時間 2026-09-19 10:00

  it("貸出中で返却予定日が昨日なら延滞", () => {
    expect(isOverdue("lent", "2026-09-18", now)).toBe(true);
  });

  it("返却予定日が今日なら延滞ではない", () => {
    expect(isOverdue("lent", "2026-09-19", now)).toBe(false);
  });

  it("貸出中以外は延滞にしない", () => {
    expect(isOverdue("approved", "2026-09-01", now)).toBe(false);
    expect(isOverdue("returned", "2026-09-01", now)).toBe(false);
  });
});

describe("返却期限間近の判定（BR-15）", () => {
  const now = new Date("2026-09-19T01:00:00Z");

  it("今日から3日後までは期限間近", () => {
    expect(isDueSoon("lent", "2026-09-19", now)).toBe(true);
    expect(isDueSoon("lent", "2026-09-22", now)).toBe(true);
  });

  it("4日後は期限間近ではない", () => {
    expect(isDueSoon("lent", "2026-09-23", now)).toBe(false);
  });

  it("延滞しているものは期限間近に含めない", () => {
    expect(isDueSoon("lent", "2026-09-18", now)).toBe(false);
  });
});

describe("返却予定日の範囲（BR-05）", () => {
  const now = new Date("2026-09-19T01:00:00Z");

  it("翌日から30日後までを受け付ける", () => {
    expect(isSelectableDueDate("2026-09-20", now)).toBe(true);
    expect(isSelectableDueDate("2026-10-19", now)).toBe(true);
  });

  it("当日と31日後は受け付けない", () => {
    expect(isSelectableDueDate("2026-09-19", now)).toBe(false);
    expect(isSelectableDueDate("2026-10-20", now)).toBe(false);
  });
});
