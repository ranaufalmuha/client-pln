"use client";

import { DashboardShell } from "@/shared/components/dashboard-shell";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useAppRouter } from "@/shared/lib/app-router";

const reportOptions = [
  { title: "Kirim WhatsApp Tegangan", path: "/laporan/kirim-whatsapp-tegangan" },
  { title: "Kirim WhatsApp OMGI", path: "/laporan/kirim-whatsapp-omgi" },
  { title: "Laporan Mutasi", path: "/laporan/laporan-mutasi" },
  { title: "Laporan Bulanan", path: "/laporan/laporan-bulanan" },
  { title: "Rekap Berkas", path: "/laporan/rekap-berkas" },
  { title: "Print Beban", path: "/laporan/print-beban" },
] as const;

export default function LaporanPage() {
  const { navigate } = useAppRouter();

  return (
    <DashboardShell title="Laporan">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Laporan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reportOptions.map((option) => (
              <div
                key={option.path}
                className="rounded-lg border p-4 text-left transition-colors hover:bg-accent/40"
              >
                <p className="mb-4 font-medium">{option.title}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(option.path)}
                >
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
