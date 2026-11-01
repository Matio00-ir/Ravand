import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { currentUser } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "ورود به پنل مدیریت",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // The panel is Persian-only; /en/admin/… lands on the fa route.
  if (locale !== "fa") redirect("/admin/login");
  if (await currentUser()) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center bg-deep px-6">
      <div className="w-full max-w-sm">
        <Logo tone="inverse" />
        <h1 className="t-h3 mt-8 text-offwhite">پنل مدیریت روند</h1>
        <p className="t-small mt-2 text-steel">برای ادامه وارد شوید.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
