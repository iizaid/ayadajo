import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { FormField } from "@/components/FormField";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge, type StatusBadgeTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

type PreviewRow = {
  id: string;
  item: string;
  status: StatusBadgeTone;
  owner: string;
};

const previewRows: PreviewRow[] = [
  {
    id: "1",
    item: t("placeholder.table.rows.first.item"),
    status: "success",
    owner: t("placeholder.table.rows.first.owner"),
  },
  {
    id: "2",
    item: t("placeholder.table.rows.second.item"),
    status: "warning",
    owner: t("placeholder.table.rows.second.owner"),
  },
  {
    id: "3",
    item: t("placeholder.table.rows.third.item"),
    status: "neutral",
    owner: t("placeholder.table.rows.third.owner"),
  },
];

const previewColumns: DataTableColumn<PreviewRow>[] = [
  {
    key: "item",
    header: t("placeholder.table.columns.item"),
    render: (row) => <span className="font-medium text-text-primary">{row.item}</span>,
  },
  {
    key: "status",
    header: t("placeholder.table.columns.status"),
    render: (row) => <StatusBadge tone={row.status} label={t(`status.${row.status}`)} />,
  },
  {
    key: "owner",
    header: t("placeholder.table.columns.owner"),
    render: (row) => <span className="text-text-secondary">{row.owner}</span>,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="ay-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-accent">{t("app.kicker")}</p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-4xl">
              {t("placeholder.title")}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-text-secondary">
              {t("placeholder.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>{t("actions.primary")}</Button>
            <Button variant="secondary">{t("actions.secondary")}</Button>
          </div>
        </header>

        <section
          aria-label={t("placeholder.sections.metrics")}
          className="grid gap-4 md:grid-cols-3"
        >
          <MetricCard
            label={t("metrics.today.label")}
            value="12"
            context={t("metrics.today.context")}
            icon={CalendarDays}
            trend={t("metrics.today.trend")}
          />
          <MetricCard
            label={t("metrics.waiting.label")}
            value="3"
            context={t("metrics.waiting.context")}
            icon={Loader2}
            tone="warning"
          />
          <MetricCard
            label={t("metrics.completed.label")}
            value="8"
            context={t("metrics.completed.context")}
            icon={CheckCircle2}
            tone="success"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("placeholder.table.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                caption={t("placeholder.table.caption")}
                columns={previewColumns}
                rows={previewRows}
                getRowKey={(row) => row.id}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <EmptyState
              icon={ClipboardList}
              title={t("empty.title")}
              description={t("empty.description")}
              actionLabel={t("empty.action")}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t("form.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  id="clinic-name"
                  label={t("form.name.label")}
                  hint={t("form.name.hint")}
                >
                  <Input id="clinic-name" placeholder={t("form.name.placeholder")} />
                </FormField>
                <FormField
                  id="clinic-error"
                  label={t("form.error.label")}
                  error={t("form.error.message")}
                >
                  <Input
                    id="clinic-error"
                    aria-invalid="true"
                    placeholder={t("form.error.placeholder")}
                  />
                </FormField>
                <Button disabled className="w-full">
                  {t("actions.disabled")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="ay-panel grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-3">
            <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-action-warm" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-text-primary">{t("states.title")}</h2>
              <p className="text-sm leading-6 text-text-secondary">{t("states.description")}</p>
            </div>
          </div>
          <ConfirmDialog
            triggerLabel={t("dialog.trigger")}
            title={t("dialog.title")}
            description={t("dialog.description")}
            confirmLabel={t("dialog.confirm")}
            cancelLabel={t("dialog.cancel")}
          />
        </section>
      </div>
    </main>
  );
}
