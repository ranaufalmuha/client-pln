"use client";

import { useMemo, useState } from "react";

import { DashboardShell } from "@/shared/components/dashboard-shell";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAppRouter } from "@/shared/lib/app-router";
import { appEnv } from "@/shared/lib/env";

function formatDateLabel(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function KirimWhatsAppOmgiPage() {
  const { navigate } = useAppRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [omgiIn, setOmgiIn] = useState("");
  const [omgiOut, setOmgiOut] = useState("");
  const [note, setNote] = useState("");

  const message = useMemo(
    () => `*Laporan OMGI*

Tanggal: ${formatDateLabel(date)}
Jam: ${time} ${appEnv.reportTimezoneLabel}
OMGI In: ${omgiIn}
OMGI Out: ${omgiOut}
Catatan: ${note}`,
    [date, note, omgiIn, omgiOut, time],
  );

  const whatsappTarget = appEnv.reportWhatsAppPhone
    ? `https://wa.me/${appEnv.reportWhatsAppPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <DashboardShell title="Kirim WhatsApp OMGI">
      <div className="grid gap-4 px-4 lg:px-6">
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => navigate("/laporan")}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kirim WhatsApp OMGI</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="omgi-date">Tanggal</Label>
                <Input id="omgi-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="omgi-time">Jam</Label>
                <Input id="omgi-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="omgi-in">OMGI In</Label>
                <Input id="omgi-in" value={omgiIn} onChange={(event) => setOmgiIn(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="omgi-out">OMGI Out</Label>
                <Input id="omgi-out" value={omgiOut} onChange={(event) => setOmgiOut(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="omgi-note">Catatan</Label>
                <Input id="omgi-note" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <pre className="whitespace-pre-wrap text-sm">{message}</pre>
              </div>
              <Button asChild className="w-full">
                <a href={whatsappTarget} target="_blank" rel="noopener noreferrer">
                  Open WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
