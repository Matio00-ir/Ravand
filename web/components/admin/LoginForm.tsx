"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/admin/actions/auth";
import type { AdminState } from "@/lib/admin/act";
import { Button, inputClass } from "@/components/admin/forms";

const ERRORS: Record<string, string> = {
  invalid: "نام کاربری یا رمز عبور درست نیست.",
  locked: "به دلیل تلاش‌های ناموفق زیاد، ورود این حساب ۱۵ دقیقه قفل شده است.",
  setup: "هنوز حسابی ساخته نشده. ADMIN_USERNAME و ADMIN_PASSWORD (حداقل ۸ کاراکتر) را در تنظیمات سرور قرار دهید.",
  fields: "نام کاربری و رمز عبور را وارد کنید.",
  server: "ورود ممکن نشد. اتصال پایگاه داده را بررسی کنید.",
};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { status: "idle" } as AdminState);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="username" className="t-label mb-1.5 block text-steel">
          نام کاربری
        </label>
        <input id="username" name="username" autoComplete="username" dir="ltr" required className={`${inputClass} text-start`} />
      </div>
      <div>
        <label htmlFor="password" className="t-label mb-1.5 block text-steel">
          رمز عبور
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required className={`${inputClass} text-start`} />
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-[12.5px] leading-relaxed text-error">
          {ERRORS[state.error ?? "server"] ?? ERRORS.server}
        </p>
      ) : null}
      <Button type="submit" pending={pending} className="w-full">
        ورود به پنل
      </Button>
    </form>
  );
}
