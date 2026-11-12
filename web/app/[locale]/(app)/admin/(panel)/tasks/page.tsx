import { EntityForm } from "@/components/admin/forms";
import { TaskRows } from "@/components/admin/blocks";
import { PageHeader, Section, Tabs } from "@/components/admin/ui";
import { saveTask } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { listTasks } from "@/lib/admin/crm";
import { taskFields } from "@/lib/admin/defs";
import { todayIso } from "@/lib/admin/jalali";
import { userOptions } from "@/lib/admin/settings";

export const metadata = { title: "کارها و پیگیری‌ها" };

const FILTERS = {
  open: { label: "باز", where: "NOT t.done" },
  today: { label: "امروز و عقب‌افتاده", where: "NOT t.done AND t.due_date <= $1" },
  mine: { label: "کارهای من", where: "NOT t.done AND t.assignee_id = $1" },
  done: { label: "انجام‌شده", where: "t.done" },
} as const;

/** Every follow-up across deals, customers, projects and tickets, plus standalone to-dos. */
export default async function TasksPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requirePage("dashboard");
  const { f } = await searchParams;
  const key = (f && f in FILTERS ? f : "open") as keyof typeof FILTERS;
  const today = todayIso();

  const params = key === "today" ? [today] : key === "mine" ? [user.id] : [];
  const [tasks, users] = await Promise.all([listTasks(FILTERS[key].where, params), userOptions()]);

  return (
    <>
      <PageHeader title="کارها و پیگیری‌ها" meta="همه یادآورها — از فرصت‌های فروش تا پروژه‌ها و تیکت‌ها" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section title="فهرست کارها">
          <div className="mb-4">
            <Tabs
              items={Object.entries(FILTERS).map(([k, x]) => ({
                href: k === "open" ? "/admin/tasks" : `/admin/tasks?f=${k}`,
                label: x.label,
                active: k === key,
              }))}
            />
          </div>
          <TaskRows tasks={tasks} showEntity />
        </Section>
        <Section title="کار جدید" meta="یادآور مستقل؛ برای کار مربوط به یک پرونده، از صفحه همان پرونده اضافه کنید">
          <EntityForm
            action={saveTask}
            fields={taskFields(users)}
            values={{ priority: "normal", assignee_id: user.id }}
            submitLabel="افزودن"
            resetOnSuccess
          />
        </Section>
      </div>
    </>
  );
}
