"use client";

import * as React from "react";

import { DashboardShell } from "@/shared/components/dashboard-shell";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getUnitCategories } from "@/shared/lib/api";
import { useAppRouter } from "@/shared/lib/app-router";

export default function LaporanBulananPage() {
  const { navigate, token } = useAppRouter();
  const [regionOptions, setRegionOptions] = React.useState<string[]>([]);
  const [region, setRegion] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [reportNumber, setReportNumber] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadRegionOptions = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const categories = await getUnitCategories(token);
      const options = categories.map((item) => item.name);
      setRegionOptions(options);
      setRegion((current) => (current ? current : options[0] ?? ""));
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Gagal memuat kategori unit";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadRegionOptions();
  }, [loadRegionOptions]);

  return (
    <DashboardShell title="Laporan Bulanan">
      <div className="grid gap-4 px-4 lg:px-6">
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => navigate("/laporan")}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori Unit</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger disabled={isLoading || regionOptions.length === 0}>
                  <SelectValue placeholder={isLoading ? "Loading..." : "Pilih kategori"} />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulanan-month">Periode</Label>
              <Input id="bulanan-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulanan-number">Nomor Laporan</Label>
              <Input
                id="bulanan-number"
                value={reportNumber}
                onChange={(event) => setReportNumber(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <Button type="button">Generate PDF</Button>
              <Button type="button" variant="outline">
                Export XLSX
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
