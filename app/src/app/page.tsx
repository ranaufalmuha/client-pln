import { DashboardShell } from "@/shared/components/dashboard-shell";
import { ChartAreaInteractive } from "@/shared/components/chart-area-interactive";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  formatDateLabel,
  getBayLabel,
  getHighestLoadForDate,
  latestDashboardDate,
} from "@/shared/lib/dashboard-load";

export default function DashboardPage() {
  const highestToday = getHighestLoadForDate(latestDashboardDate);

  return (
    <DashboardShell title="Dashboard">
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Hari Ini</CardTitle>
            <CardDescription>
              Beban tertinggi untuk {formatDateLabel(latestDashboardDate)}.
            </CardDescription>
          </CardHeader>
          {highestToday ? (
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{highestToday.time} WIB</Badge>
                <Badge variant="outline">
                  Bay {getBayLabel(highestToday.bay)}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">A</p>
                  <p className="mt-1 text-lg font-semibold">
                    {highestToday.ampere.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">kV</p>
                  <p className="mt-1 text-lg font-semibold">
                    {highestToday.kV.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">MW</p>
                  <p className="mt-1 text-lg font-semibold">
                    {highestToday.mw.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">kvar</p>
                  <p className="mt-1 text-lg font-semibold">
                    {highestToday.kvar.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Data beban belum tersedia.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
