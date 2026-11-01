import { ActionButton, EntityForm } from "@/components/admin/forms";
import { Badge, Empty, Section, jdate, jdatetime } from "@/components/admin/ui";
import { addActivity, deleteTask, saveTask, toggleTask } from "@/lib/admin/actions/crm";
import { listActivities, listTasks } from "@/lib/admin/crm";
import { activityFields, taskFields } from "@/lib/admin/defs";
import { daysFromToday } from "@/lib/admin/jalali";
import { ACTIVITY_KINDS, PRIORITIES, labelOf } from "@/lib/admin/labels";
import { userOptions } from "@/lib/admin/settings";
import { cn } from "@/lib/utils";

/**
 * The two blocks every record page shares: a timeline of notes, calls
 * and system events, and the follow-up tasks attached to the record.
 */

export async function Timeline({ entity, entityId }: { entity: string; entityId: number }) {
  const items = await listActivities(entity, entityId);
  return (
    <Section title="تاریخچه و یادداشت‌ها" meta="تماس، جلسه، یادداشت و رویدادهای سیستم">
      <EntityForm
        action={addActivity}
        fields={activityFields}
        values={{ kind: "call" }}
        hidden={{ entity, entity_id: entityId }}
        submitLabel="ثبت در تاریخچه"
        resetOnSuccess
      />
      <ol className="mt-6 space-y-0 border-t border-line-dark">
        {items.length === 0 ? (
          <li>
            <Empty>هنوز چیزی ثبت نشده است.</Empty>
          </li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="border-b border-line-dark py-3.5 last:border-b-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-steel">
                <span className={cn("font-semibold", a.kind === "system" ? "text-steel" : "text-silver")}>{labelOf(ACTIVITY_KINDS, a.kind)}</span>
                <span className="t-num">{jdatetime(a.created_at)}</span>
                {a.user_name ? <span>· {a.user_name}</span> : null}
              </div>
              <p className={cn("mt-1.5 whitespace-pre-line text-[13.5px]", a.kind === "system" ? "text-steel" : "text-offwhite")}>{a.body}</p>
            </li>
          ))
        )}
      </ol>
    </Section>
  );
}

export async function TaskPanel({ entity, entityId }: { entity: string; entityId: number }) {
  const [tasks, users] = await Promise.all([
    listTasks(`t.entity = $1 AND t.entity_id = $2`, [entity, String(entityId)]),
    userOptions(),
  ]);
  return (
    <Section title="کارها و یادآورها" meta="پیگیری‌های این پرونده">
      <TaskRows tasks={tasks} />
      <div className="mt-5 border-t border-line-dark pt-5">
        <EntityForm
          action={saveTask}
          fields={taskFields(users)}
          values={{ priority: "normal" }}
          hidden={{ entity, entity_id: entityId }}
          submitLabel="افزودن کار"
          resetOnSuccess
        />
      </div>
    </Section>
  );
}

export function TaskRows({
  tasks,
  showEntity = false,
}: {
  tasks: Awaited<ReturnType<typeof listTasks>>;
  showEntity?: boolean;
}) {
  if (tasks.length === 0) return <Empty>کاری ثبت نشده است.</Empty>;
  return (
    <ul className="divide-y divide-line-dark">
      {tasks.map((t) => {
        const days = t.due_date ? daysFromToday(t.due_date) : null;
        const late = !t.done && days !== null && days < 0;
        const today = !t.done && days === 0;
        return (
          <li key={t.id} className="flex flex-wrap items-start gap-3 py-3">
            <ActionButton action={toggleTask} hidden={{ id: t.id }} label={t.done ? "↺" : "✓"} small />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[13.5px]", t.done ? "text-steel line-through" : "text-offwhite")}>{t.title}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-steel">
                {t.due_date ? (
                  <span className={cn("t-num", late && "text-error", today && "text-warning")}>
                    {late ? "عقب‌افتاده · " : today ? "امروز · " : ""}
                    {jdate(t.due_date)}
                  </span>
                ) : null}
                <Badge map={PRIORITIES} value={t.priority} />
                {t.assignee_name ? <span>{t.assignee_name}</span> : null}
                {showEntity && t.entity_label ? <span>· {t.entity_label}</span> : null}
              </p>
              {t.notes ? <p className="mt-1 text-[12.5px] text-silver">{t.notes}</p> : null}
            </div>
            <ActionButton action={deleteTask} hidden={{ id: t.id }} label="حذف" confirm="این کار حذف شود؟" small />
          </li>
        );
      })}
    </ul>
  );
}
