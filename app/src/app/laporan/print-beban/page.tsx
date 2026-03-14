"use client";

import { useState } from "react";

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
import { useAppRouter } from "@/shared/lib/app-router";
import { appEnv } from "@/shared/lib/env";
const unitOptions = appEnv.reportPrintUnits;

export default function PrintBebanPage() {
  const { navigate } = useAppRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [unit, setUnit] = useState(unitOptions[0]);

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
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
