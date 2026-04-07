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

export default function LaporanMutasiPage() {
  const { navigate, token } = useAppRouter();
  const [unitOptions, setUnitOptions] = React.useState<string[]>([]);
  const [unit, setUnit] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadUnitCategories = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const categories = await getUnitCategories(token);
      const options = categories.map((item) => item.name);
      setUnitOptions(options);
      setUnit((current) => (current ? current : options[0] ?? ""));
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Gagal memuat kategori unit";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadUnitCategories();
  }, [loadUnitCategories]);

  const sanitizedUnit = (unit || "unit").split("/").join("-");
  const fileName = `laporan-mutasi-${sanitizedUnit}-${dateFrom || "start"}-${dateTo || "end"}.pdf`;

  return (
    <DashboardShell title="Laporan Mutasi">
      <div className="grid gap-4 px-4 lg:px-6">
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => navigate("/laporan")}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Mutasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger disabled={isLoading || unitOptions.length === 0}>
                  <SelectValue placeholder={isLoading ? "Loading..." : "Pilih unit"} />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mutasi-from">Tanggal Awal</Label>
              <Input id="mutasi-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mutasi-to">Tanggal Akhir</Label>
              <Input id="mutasi-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input value={fileName} disabled />
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
