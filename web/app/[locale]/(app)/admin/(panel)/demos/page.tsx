import { Panel, StatRow, StatTile, Status, Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/admin/forms";
import { A, Badge, Empty, PageHeader, fa, isoOf, jdate, jdatetime } from "@/components/admin/ui";
import { updateDemo } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { listDemos } from "@/lib/admin/crm";
import { daysFromToday } from "@/lib/admin/jalali";
import { DEAL_STAGES, INDUSTRIES, labelOf } from "@/lib/admin/labels";

export const metadata = { title: "دموهای سایت" };

/** Every private demo created on the website, with real usage, so the engaged ones get called first. */
export default async function DemosPage() {
  await requirePage("crm");
  const demos = await listDemos();
  const rows = demos.map((d) => {
    const left = daysFromToday(isoOf(d.expires_at));
    const state = d.status === "disabled" ? "disabled" : left < 0 ? "expired" : "active";
    return { ...d, left, state };
  });

  return (
    <>
      <PageHeader title="دموهای سایت" meta="محیط‌های اختصاصی که بازدیدکننده‌ها در سایت ساخته‌اند؛ مرتب‌شده از جدید به قدیم" />
      <div className="space-y-6">
        <StatRow>
          <StatTile label="کل دموها" value={fa(rows.length)} />
          <StatTile label="فعال" value={fa(rows.filter((r) => r.state === "active").length)} />
          <StatTile label="استفاده‌شده" value={fa(rows.filter((r) => r.actions > 0).length)} delta="حداقل یک کار در دمو" />
          <StatTile label="بدون بازدید دوم" value={fa(rows.filter((r) => r.access_count <= 1).length)} delta="نیاز به تماس" trend="down" />
        </StatRow>
        <Panel flush>
          <Table
            head={[
              { label: "مشتری" },
              { label: "کسب‌وکار", hideBelow: "lg" },
              { label: "دوره" },
              { label: "استفاده", align: "end" },
              { label: "فرصت", hideBelow: "md" },
              { label: "اقدام" },
            ]}
          >
            {rows.length === 0 ? <Empty colSpan={6}>هنوز دمویی ساخته نشده است.</Empty> : null}
            {rows.map((d) => (
              <Tr key={d.id}>
                <Td>
                  <p className="font-semibold">{d.company}</p>
                  <p className="mt-0.5 text-[12px] text-silver">{d.name}</p>
                  <a href={`tel:${d.mobile}`} className="t-num block text-[12px] text-steel hover:text-silver" dir="ltr">{d.mobile}</a>
                </Td>
                <Td muted hideBelow="lg">
                  {labelOf(INDUSTRIES, d.business_type)}
                  <span className="block text-[12px] text-steel">{fa(d.user_count)} کاربر</span>
                </Td>
                <Td>
                  <Status tone={d.state === "active" ? "success" : d.state === "expired" ? "neutral" : "error"}>
                    {d.state === "active" ? `${fa(d.left)} روز مانده` : d.state === "expired" ? "منقضی" : "غیرفعال"}
                  </Status>
                  <span className="t-num mt-1 block text-[11.5px] text-steel">ساخت: {jdate(isoOf(d.created_at))}</span>
                </Td>
                <Td align="end">
                  <p className="t-num">{fa(d.access_count)} بازدید</p>
                  <p className="t-num text-[12px] text-silver">{fa(d.actions)} اقدام · {fa(d.invoices)} فاکتور</p>
                  <p className="text-[11.5px] text-steel">{d.last_accessed_at ? jdatetime(d.last_accessed_at) : "باز نشده"}</p>
                </Td>
                <Td hideBelow="md">
                  {d.deal_id ? (
                    <A href={`/admin/deals/${d.deal_id}`}>
                      <Badge map={DEAL_STAGES} value={d.deal_stage} />
                    </A>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <ActionButton action={updateDemo} hidden={{ id: d.id, op: "extend" }} label="۷ روز تمدید" small />
                    {d.status === "disabled" ? (
                      <ActionButton action={updateDemo} hidden={{ id: d.id, op: "enable" }} label="فعال‌سازی" small />
                    ) : (
                      <ActionButton action={updateDemo} hidden={{ id: d.id, op: "disable" }} label="غیرفعال" variant="danger" small confirm="دسترسی این مشتری به دموی خود قطع شود؟" />
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
