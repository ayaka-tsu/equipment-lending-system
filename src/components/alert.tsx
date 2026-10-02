/**
 * メッセージの共通表示（docs/03_screen_list.md 3.8）
 * デザイン：Figma の Alert（node 4:61）
 *
 * success＝操作の成功、danger＝エラー、warning＝注意、info＝お知らせ。
 * 色だけで区別せず、必ず文字で内容が分かるようにする（NFR-E-03）。
 */
export type AlertTone = "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<AlertTone, string> = {
  success: "bg-success-subtle border-success-border text-success-text",
  warning: "bg-warning-subtle border-warning-border text-warning-text",
  danger: "bg-danger-subtle border-danger-border text-danger",
  info: "bg-primary-subtle border-primary text-primary",
};

export function Alert({
  tone = "success",
  children,
  onClose,
  closeHref,
}: {
  tone?: AlertTone;
  children: React.ReactNode;
  /** 閉じるボタンの動作。クライアント側で閉じる場合に渡す */
  onClose?: () => void;
  /** 閉じるボタンをリンクにする場合の遷移先（サーバーコンポーネントから使う） */
  closeHref?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-center gap-3 rounded-md border px-4 py-3 text-[14px] leading-[22px] font-medium ${TONE_CLASS[tone]}`}
    >
      <p className="min-w-0 flex-1">{children}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="メッセージを閉じる"
          className="shrink-0 cursor-pointer text-[14px] leading-[22px] font-normal"
        >
          ×
        </button>
      )}
      {!onClose && closeHref && (
        <a
          href={closeHref}
          aria-label="メッセージを閉じる"
          className="shrink-0 text-[14px] leading-[22px] font-normal"
        >
          ×
        </a>
      )}
    </div>
  );
}
