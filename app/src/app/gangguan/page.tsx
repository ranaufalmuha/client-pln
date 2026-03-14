import { DashboardShell } from "@/shared/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const incidents = [
  {
    title: "Penyulang Timur",
    severity: "High",
    detail: "Trip terdeteksi pukul 08:42 dengan estimasi pemulihan 25 menit.",
  },
  {
    title: "Gardu Selatan",
    severity: "Medium",
    detail: "Tegangan turun sesaat, perlu inspeksi lapangan untuk verifikasi beban.",
  },
  {
    title: "SCADA Link",
    severity: "Low",
    detail: "Latency meningkat tetapi telemetri masih diterima normal.",
  },
];

export default function GangguanPage() {
  return (
    <DashboardShell title="Gangguan">
      <div className="grid gap-4 px-4 lg:px-6 xl:grid-cols-3">
        {incidents.map((incident) => (
          <Card key={incident.title}>
            <CardHeader>
              <CardDescription>{incident.severity} Priority</CardDescription>
              <CardTitle>{incident.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {incident.detail}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Penanganan</CardTitle>
            <CardDescription>
              Fokuskan dispatch ke gangguan dengan pelanggan terdampak tertinggi.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md border px-4 py-3">
              Crew A sedang menuju lokasi Penyulang Timur.
            </div>
            <div className="rounded-md border px-4 py-3">
              Crew B standby untuk verifikasi Gardu Selatan.
            </div>
            <div className="rounded-md border px-4 py-3">
              Tim NOC memantau kualitas link SCADA setiap 5 menit.
            </div>
            <div className="rounded-md border px-4 py-3">
              Escalation akan dilakukan jika outage melebihi SLA.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
