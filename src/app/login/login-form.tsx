"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldErrors = { email?: string; password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ sessionExpired }: { sessionExpired: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 画面側の入力チェック（SCR-01）。サーバー側でも同じ内容を検証する（NFR-S-08）。 */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "メールアドレスを入力してください";
    else if (!EMAIL_PATTERN.test(email.trim()))
      errors.email = "メールアドレスの形式が正しくありません";
    if (!password) errors.password = "パスワードを入力してください";
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      setFormError(
        body?.error?.message ?? "通信に失敗しました。ネットワーク接続を確認してください。",
      );
      setPassword("");
    } catch {
      setFormError("通信に失敗しました。ネットワーク接続を確認してください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
      {sessionExpired && (
        <p className="rounded-md border border-warning-border bg-warning-subtle px-4 py-3 text-sm text-warning-text">
          セッションの有効期限が切れました。再度ログインしてください。
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
          メールアドレス
          <span className="rounded-sm bg-danger-subtle px-1.5 text-xs font-medium text-danger">
            必須
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {fieldErrors.email && <p className="text-xs text-danger">{fieldErrors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium">
          パスワード
          <span className="rounded-sm bg-danger-subtle px-1.5 text-xs font-medium text-danger">
            必須
          </span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {fieldErrors.password && <p className="text-xs text-danger">{fieldErrors.password}</p>}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-md border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary hover:bg-primary-hover disabled:opacity-40"
      >
        {submitting ? "送信中…" : "ログイン"}
      </button>
    </form>
  );
}
