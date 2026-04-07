"use client";

import * as React from "react";

import { getBebans, type Beban } from "@/shared/lib/api";
import { useAppRouter } from "@/shared/lib/app-router";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { appEnv } from "@/shared/lib/env";
import { cn } from "@/shared/lib/utils";

type TimeSlot = "10:00" | "14:00" | "19:00";
type VoltageField = {
  key: string;
  label: string;
  unitCategoryKey: string;
  bayName: string;
  withTap: boolean;
};

const timeSlots: TimeSlot[] = ["10:00", "14:00", "19:00"];

const gitetFields: VoltageField[] = [
  { key: "cilegon", label: "Cilegon", unitCategoryKey: "penghantar-gitet", bayName: "Cilegon", withTap: false },
  { key: "depok1", label: "Depok 1", unitCategoryKey: "penghantar-gitet", bayName: "Depok 1", withTap: false },
  { key: "depok2", label: "Depok 2", unitCategoryKey: "penghantar-gitet", bayName: "Depok 2", withTap: false },
  { key: "saguling1", label: "Saguling 1", unitCategoryKey: "penghantar-gitet", bayName: "Saguling 1", withTap: false },
  { key: "saguling2", label: "Saguling 2", unitCategoryKey: "penghantar-gitet", bayName: "Saguling 2", withTap: false },
  { key: "tambun1", label: "Tambun 1", unitCategoryKey: "penghantar-gitet", bayName: "Tambun 1", withTap: false },
  { key: "tambun2", label: "Tambun 2", unitCategoryKey: "penghantar-gitet", bayName: "Tambun 2", withTap: false },
  { key: "ibt1", label: "IBT 1", unitCategoryKey: "ibt-gitet", bayName: "IBT 1 500/150 kV", withTap: true },
  { key: "ibt2", label: "IBT 2", unitCategoryKey: "ibt-gitet", bayName: "IBT 2 500/150 kV", withTap: true },
  { key: "ibt3", label: "IBT 3", unitCategoryKey: "ibt-gitet", bayName: "IBT 3 500/150 kV", withTap: true },
];

const giFields: VoltageField[] = [
  { key: "cibubur1", label: "Cibubur 1", unitCategoryKey: "penghantar-gi", bayName: "Cibubur 1", withTap: false },
  { key: "cibubur2", label: "Cibubur 2", unitCategoryKey: "penghantar-gi", bayName: "Cibubur 2", withTap: false },
  { key: "sentul1", label: "Sentul 1", unitCategoryKey: "penghantar-gi", bayName: "Sentul 1", withTap: false },
  { key: "sentul2", label: "Sentul 2", unitCategoryKey: "penghantar-gi", bayName: "Sentul 2", withTap: false },
  { key: "cimanggis1", label: "Cimanggis 1", unitCategoryKey: "penghantar-gi", bayName: "Cimanggis 1", withTap: false },
  { key: "cimanggis2", label: "Cimanggis 2", unitCategoryKey: "penghantar-gi", bayName: "Cimanggis 2", withTap: false },
];

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toTimeSlot(value: Date): string {
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function formatDateForMessage(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatValue(record: Beban, withTap: boolean) {
  const kvLabel = `${record.kv.toFixed(2)} kV`;
  if (!withTap) {
    return kvLabel;
  }

  if (record.tap === null) {
    return `${kvLabel} / Tap -`;
  }

  const tapLabel = Number.isInteger(record.tap) ? record.tap.toString() : record.tap.toFixed(2);
  return `${kvLabel} / Tap ${tapLabel}`;
}

function findLatestRecord(
  records: Beban[],
  unitCategoryKey: string,
  bayName: string,
  selectedDate: string,
  selectedTime: TimeSlot,
) {
  const matches = records
    .filter((item) => item.unitCategoryKey === unitCategoryKey)
    .filter((item) => item.bayName?.toLowerCase() === bayName.toLowerCase())
    .filter((item) => {
      const measuredAt = new Date(item.measuredAt);
      return (
        toDateKey(measuredAt) === selectedDate && toTimeSlot(measuredAt) === selectedTime
      );
    })
    .sort((a, b) => {
      const aTime = new Date(a.measuredAt).getTime();
      const bTime = new Date(b.measuredAt).getTime();
      return bTime - aTime;
    });

  return matches[0] ?? null;
}

function buildMessage(
  title: string,
  selectedDate: string,
  selectedTime: TimeSlot,
  fields: VoltageField[],
  records: Beban[],
) {
  const lines = fields.map((field) => {
    const record = findLatestRecord(
      records,
      field.unitCategoryKey,
      field.bayName,
      selectedDate,
      selectedTime,
    );
    const value = record ? formatValue(record, field.withTap) : "-";
    return `${field.label}: ${value}`;
  });

  return `*${title}*\n\nTanggal: ${formatDateForMessage(selectedDate)}\nJam: ${selectedTime} ${appEnv.reportTimezoneLabel}\n${lines.join("\n")}`;
}

function buildWhatsAppHref(message: string) {
  if (appEnv.reportWhatsAppPhone) {
    return `https://wa.me/${appEnv.reportWhatsAppPhone}?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function FieldGrid({
  fields,
  records,
  selectedDate,
  selectedTime,
}: {
  fields: VoltageField[];
  records: Beban[];
  selectedDate: string;
  selectedTime: TimeSlot;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => {
        const record = findLatestRecord(
          records,
          field.unitCategoryKey,
          field.bayName,
          selectedDate,
          selectedTime,
        );
        const value = record ? formatValue(record, field.withTap) : "-";

        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Input value={value} disabled />
          </div>
        );
      })}
    </div>
  );
}

export default function KirimWhatsAppTeganganPage() {
  const { navigate, token } = useAppRouter();
  const [records, setRecords] = React.useState<Beban[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(() => toDateKey(new Date()));
  const [selectedTime, setSelectedTime] = React.useState<TimeSlot>("10:00");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadRecords = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getBebans(token);
      setRecords(response);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Failed to load tegangan";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const gitetMessage = React.useMemo(
    () =>
      buildMessage(
        "Laporan Tegangan GITET",
        selectedDate,
        selectedTime,
        gitetFields,
        records,
      ),
    [records, selectedDate, selectedTime],
  );

  const giMessage = React.useMemo(
    () =>
      buildMessage(
        "Laporan Tegangan GI",
        selectedDate,
        selectedTime,
        giFields,
        records,
      ),
    [records, selectedDate, selectedTime],
  );

  const gitetHref = React.useMemo(() => buildWhatsAppHref(gitetMessage), [gitetMessage]);
  const giHref = React.useMemo(() => buildWhatsAppHref(giMessage), [giMessage]);

  return (
    <DashboardShell title="Kirim WhatsApp Tegangan">
      <div className="grid gap-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/laporan")}>
            Back
          </Button>
          <Button type="button" variant="outline" onClick={() => void loadRecords()}>
            Refresh
          </Button>
          {isLoading ? <Badge variant="outline">Loading</Badge> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kirim WhatsApp Tegangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tegangan-date">Tanggal</Label>
                <Input
                  id="tegangan-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Jam</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {timeSlots.map((slot) => (
                    <label
                      key={slot}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        selectedTime === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <input
                        type="radio"
                        name="tegangan-time"
                        value={slot}
                        checked={selectedTime === slot}
                        onChange={() => setSelectedTime(slot)}
                        className="sr-only"
                      />
                      {slot}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Tabs defaultValue="wa-tegangan-gitet" className="gap-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="wa-tegangan-gitet" className="min-w-fit px-4">
                  GITET
                </TabsTrigger>
                <TabsTrigger value="wa-tegangan-gi" className="min-w-fit px-4">
                  GI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wa-tegangan-gitet" className="mt-0">
                <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                  <FieldGrid
                    fields={gitetFields}
                    records={records}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                  />
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6">
                        {gitetMessage}
                      </pre>
                    </div>
                    <Button asChild className="w-full">
                      <a href={gitetHref} target="_blank" rel="noopener noreferrer">
                        Open WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="wa-tegangan-gi" className="mt-0">
                <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                  <FieldGrid
                    fields={giFields}
                    records={records}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                  />
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6">
                        {giMessage}
                      </pre>
                    </div>
                    <Button asChild className="w-full">
                      <a href={giHref} target="_blank" rel="noopener noreferrer">
                        Open WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
