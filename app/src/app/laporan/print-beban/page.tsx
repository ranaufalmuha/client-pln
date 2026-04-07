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
import { getBays, type Bay } from "@/shared/lib/api";
import { useAppRouter } from "@/shared/lib/app-router";

export default function PrintBebanPage() {
  const { navigate, token } = useAppRouter();
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("10:00");
  const [bays, setBays] = React.useState<Bay[]>([]);
  const [selectedBayId, setSelectedBayId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadBays = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getBays(token);
      setBays(response);
      setSelectedBayId((current) => (current ? current : String(response[0]?.id ?? "")));
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal memuat bay";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadBays();
  }, [loadBays]);

  return (
    <DashboardShell title="Print Beban">
      <div className="grid gap-4 px-4 lg:px-6">
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => navigate("/laporan")}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Print Beban</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="print-date">Tanggal</Label>
              <Input id="print-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="print-time">Jam</Label>
              <Input id="print-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Bay</Label>
              <Select value={selectedBayId} onValueChange={setSelectedBayId}>
                <SelectTrigger disabled={isLoading || bays.length === 0}>
                  <SelectValue placeholder={isLoading ? "Loading..." : "Pilih bay"} />
                </SelectTrigger>
                <SelectContent>
                  {bays.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.unitName} / {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <Button type="button">Preview</Button>
              <Button type="button" variant="outline">
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
