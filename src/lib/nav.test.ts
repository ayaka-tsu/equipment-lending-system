import { describe, expect, it } from "vitest";

import { ADMIN_LINKS, MEMBER_LINKS, activeHref } from "@/lib/nav";

const ALL = [...MEMBER_LINKS, ...ADMIN_LINKS];

describe("表示中のメニューの判定（docs/03_screen_list.md 3.1）", () => {
  it("ホームはトップページのときだけ強調する", () => {
    expect(activeHref("/", ALL)).toBe("/");
    expect(activeHref("/equipment", ALL)).toBe("/equipment");
  });

  it("下位のページでも、その親のメニューを強調する", () => {
    expect(activeHref("/equipment/12", ALL)).toBe("/equipment");
    expect(activeHref("/my/loans/34", ALL)).toBe("/my/loans");
  });

  it("/admin/loans では /admin ではなく /admin/loans を強調する", () => {
    expect(activeHref("/admin/loans", ALL)).toBe("/admin/loans");
    expect(activeHref("/admin/audit-logs", ALL)).toBe("/admin/audit-logs");
    expect(activeHref("/admin", ALL)).toBe("/admin");
  });

  it("どのメニューにも当てはまらない画面では、どれも強調しない", () => {
    expect(activeHref("/settings", ALL)).toBeNull();
  });

  it("一般社員のメニューには管理者向けの項目が入っていない", () => {
    expect(MEMBER_LINKS.map((l) => l.href)).toEqual(["/", "/equipment", "/my/loans"]);
    expect(MEMBER_LINKS.some((l) => l.href.startsWith("/admin"))).toBe(false);
  });
});
