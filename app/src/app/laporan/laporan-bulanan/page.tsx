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
const regionOptions = appEnv.reportBulananRegions;

export default function LaporanBulananPage() {
  const { navigate } = useAppRouter();
  const [region, setRegion] = useState(regionOptions[0]);
  const [month, setMonth] = useState("");
  const [reportNumber, setReportNumber] = useState("");

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
              <Label>Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
