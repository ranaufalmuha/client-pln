"use client";

import * as React from "react";
import { LoaderCircleIcon, PlusIcon, RefreshCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";

import {
  createBeban,
  deleteBeban,
  getBays,
  getBebans,
  getUnits,
  updateBeban,
  type Bay,
  type Beban,
  type Unit,
} from "@/shared/lib/api";
import { useAppRouter } from "@/shared/lib/app-router";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

type PrimaryTabKey = "gitet-500kv" | "gi-150-70-kv";
type SecondaryTabKey = "penghantar-gitet" | "ibt-gitet" | "penghantar-gi" | "ibt-trafo-gi";
type TimeSlot = "10:00" | "14:00" | "19:00";
type NumericFieldKey = "tap" | "kV" | "ampere" | "mw" | "mvar" | "percentageIn";

type BebanFormState = {
  time: TimeSlot;
  tap: string;
  kV: string;
  ampere: string;
  mw: string;
  mvar: string;
  percentageIn: string;
};

type DetailFormState = BebanFormState & {
  date: string;
};

type SectionConfig = {
  key: SecondaryTabKey;
  primaryTab: PrimaryTabKey;
  label: string;
};

const primaryTabConfig: { key: PrimaryTabKey; label: string }[] = [
  { key: "gitet-500kv", label: "GITET 500kV" },
  { key: "gi-150-70-kv", label: "GI 150/70 kV" },
];

const sectionConfigs: SectionConfig[] = [
  { key: "penghantar-gitet", primaryTab: "gitet-500kv", label: "Penghantar GITET" },
  { key: "ibt-gitet", primaryTab: "gitet-500kv", label: "IBT GITET" },
  { key: "penghantar-gi", primaryTab: "gi-150-70-kv", label: "Penghantar GI" },
  { key: "ibt-trafo-gi", primaryTab: "gi-150-70-kv", label: "IBT/Trafo GI" },
];

const timeSlots: TimeSlot[] = ["10:00", "14:00", "19:00"];

function createDefaultFormState(): BebanFormState {
  return {
    time: "10:00",
    tap: "",
    kV: "",
    ampere: "",
    mw: "",
    mvar: "",
    percentageIn: "",
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isTimeSlot(value: string): value is TimeSlot {
  return value === "10:00" || value === "14:00" || value === "19:00";
}

function toNumericOrThrow(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return parsed;
}

function getMeasuredDate(dateTimeValue: string) {
  const parsed = new Date(dateTimeValue);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getMeasuredTimeSlot(dateTimeValue: string): TimeSlot {
  const measuredDate = getMeasuredDate(dateTimeValue);
  const slot = `${String(measuredDate.getHours()).padStart(2, "0")}:${String(
    measuredDate.getMinutes(),
  ).padStart(2, "0")}`;

  return isTimeSlot(slot) ? slot : "10:00";
}

function toDateInputValue(dateTimeValue: string) {
  const date = getMeasuredDate(dateTimeValue);
  return toDateKey(date);
}

function buildMeasuredAt(dateValue: string, time: TimeSlot) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const measuredDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return measuredDate.toISOString();
}

function getSectionsForPrimaryTab(primaryTab: PrimaryTabKey) {
  return sectionConfigs.filter((config) => config.primaryTab === primaryTab);
}

export default function BebanPage() {
  const { token } = useAppRouter();
  const [activePrimaryTab, setActivePrimaryTab] = React.useState<PrimaryTabKey>("gitet-500kv");
  const [activeNestedTabs, setActiveNestedTabs] = React.useState<Record<PrimaryTabKey, SecondaryTabKey>>({
    "gitet-500kv": "penghantar-gitet",
    "gi-150-70-kv": "penghantar-gi",
  });
  const [selectedUnitIds, setSelectedUnitIds] = React.useState<Record<SecondaryTabKey, string>>({
    "penghantar-gitet": "",
    "ibt-gitet": "",
    "penghantar-gi": "",
    "ibt-trafo-gi": "",
  });
  const [selectedBayIds, setSelectedBayIds] = React.useState<Record<SecondaryTabKey, string>>({
    "penghantar-gitet": "",
    "ibt-gitet": "",
    "penghantar-gi": "",
    "ibt-trafo-gi": "",
  });
  const [selectedDates, setSelectedDates] = React.useState<Record<SecondaryTabKey, Date | undefined>>({
    "penghantar-gitet": new Date(),
    "ibt-gitet": new Date(),
    "penghantar-gi": new Date(),
    "ibt-trafo-gi": new Date(),
  });
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formState, setFormState] = React.useState<BebanFormState>(createDefaultFormState());
  const [detailForm, setDetailForm] = React.useState<DetailFormState | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<Beban | null>(null);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [bays, setBays] = React.useState<Bay[]>([]);
  const [bebans, setBebans] = React.useState<Beban[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const activeSectionKey = activeNestedTabs[activePrimaryTab];

  const getUnitsBySection = React.useCallback(
    (sectionKey: SecondaryTabKey) => units.filter((unit) => unit.categoryKey === sectionKey),
    [units],
  );

  const getBaysBySection = React.useCallback(
    (sectionKey: SecondaryTabKey) => {
      const unitId = selectedUnitIds[sectionKey];
      if (!unitId) {
        return [];
      }

      return bays.filter((bay) => String(bay.unitId) === unitId);
    },
    [bays, selectedUnitIds],
  );

  const selectedBayName = React.useMemo(() => {
    const bayId = selectedBayIds[activeSectionKey];
    return bays.find((bay) => String(bay.id) === bayId)?.name ?? "";
  }, [activeSectionKey, bays, selectedBayIds]);

  const loadData = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const [fetchedUnits, fetchedBays, fetchedBebans] = await Promise.all([
        getUnits(token),
        getBays(token),
        getBebans(token),
      ]);
      setUnits(fetchedUnits);
      setBays(fetchedBays);
      setBebans(fetchedBebans);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Failed to load beban data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    setSelectedUnitIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const section of sectionConfigs) {
        const sectionUnits = getUnitsBySection(section.key);
        if (sectionUnits.length === 0) {
          if (next[section.key] !== "") {
            next[section.key] = "";
            changed = true;
          }
          continue;
        }

        if (!sectionUnits.some((item) => String(item.id) === next[section.key])) {
          next[section.key] = String(sectionUnits[0].id);
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [getUnitsBySection]);

  React.useEffect(() => {
    setSelectedBayIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const section of sectionConfigs) {
        const sectionBays = getBaysBySection(section.key);
        if (sectionBays.length === 0) {
          if (next[section.key] !== "") {
            next[section.key] = "";
            changed = true;
          }
          continue;
        }

        if (!sectionBays.some((item) => String(item.id) === next[section.key])) {
          next[section.key] = String(sectionBays[0].id);
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [getBaysBySection]);

  const updateFormField = (field: NumericFieldKey, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const updateDetailField = (field: keyof DetailFormState, value: string) => {
    setDetailForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleCreateBeban = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Authentication token not found");
      return;
    }

    const selectedDate = selectedDates[activeSectionKey] ?? new Date();
    const selectedBayId = selectedBayIds[activeSectionKey];

    if (!selectedBayId) {
      setError("Pilih bay terlebih dahulu");
      return;
    }

    const dateKey = toDateKey(selectedDate);

    setIsSaving(true);
    setError(null);
    try {
      const created = await createBeban(token, {
        bayId: Number(selectedBayId),
        kv: toNumericOrThrow(formState.kV, "kV"),
        a: toNumericOrThrow(formState.ampere, "A"),
        mw: toNumericOrThrow(formState.mw, "MW"),
        mvar: toNumericOrThrow(formState.mvar, "MVAR"),
        percentage: toNumericOrThrow(formState.percentageIn, "Percentage In"),
        tap: formState.tap ? toNumericOrThrow(formState.tap, "Tap") : null,
        measuredAt: buildMeasuredAt(dateKey, formState.time),
      });

      setBebans((current) => [created, ...current]);
      setIsFormOpen(false);
      setFormState(createDefaultFormState());
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Failed to save beban";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openDetail = (item: Beban) => {
    setSelectedItem(item);
    setDetailForm({
      date: toDateInputValue(item.measuredAt),
      time: getMeasuredTimeSlot(item.measuredAt),
      tap: item.tap?.toString() ?? "",
      kV: item.kv.toString(),
      ampere: item.a.toString(),
      mw: item.mw.toString(),
      mvar: item.mvar.toString(),
      percentageIn: item.percentage.toString(),
    });
  };

  const handleUpdateBeban = async () => {
    if (!token || !selectedItem || !detailForm) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateBeban(token, {
        id: selectedItem.id,
        bayId: selectedItem.bayId,
        kv: toNumericOrThrow(detailForm.kV, "kV"),
        a: toNumericOrThrow(detailForm.ampere, "A"),
        mw: toNumericOrThrow(detailForm.mw, "MW"),
        mvar: toNumericOrThrow(detailForm.mvar, "MVAR"),
        percentage: toNumericOrThrow(detailForm.percentageIn, "Percentage In"),
        tap: detailForm.tap ? toNumericOrThrow(detailForm.tap, "Tap") : null,
        measuredAt: buildMeasuredAt(detailForm.date, detailForm.time),
      });

      setBebans((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedItem(updated);
      setDetailForm({
        date: toDateInputValue(updated.measuredAt),
        time: getMeasuredTimeSlot(updated.measuredAt),
        tap: updated.tap?.toString() ?? "",
        kV: updated.kv.toString(),
        ampere: updated.a.toString(),
        mw: updated.mw.toString(),
        mvar: updated.mvar.toString(),
        percentageIn: updated.percentage.toString(),
      });
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Failed to update beban";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBeban = async () => {
    if (!token || !selectedItem) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await deleteBeban(token, selectedItem.id);
      setBebans((current) => current.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setDetailForm(null);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Failed to delete beban";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const getFilteredBebanList = React.useCallback(
    (sectionKey: SecondaryTabKey) => {
      const selectedDate = selectedDates[sectionKey];
      const selectedBayId = selectedBayIds[sectionKey];

      if (!selectedDate || !selectedBayId) {
        return [];
      }

      const targetDateKey = toDateKey(selectedDate);
      return bebans.filter((item) => {
        if (item.bayId === null || String(item.bayId) !== selectedBayId) {
          return false;
        }

        const measuredDate = getMeasuredDate(item.measuredAt);
        return toDateKey(measuredDate) === targetDateKey;
      });
    },
    [bebans, selectedBayIds, selectedDates],
  );

  const renderFormTrigger = () => {
    const currentBayId = selectedBayIds[activeSectionKey];

    return (
      <Sheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (open) {
            setFormState(createDefaultFormState());
          }
        }}
      >
        <Button
          type="button"
          className="w-full lg:w-auto"
          onClick={() => setIsFormOpen(true)}
          disabled={!currentBayId}
        >
          <PlusIcon />
          Add Beban
        </Button>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Tambah Beban</SheetTitle>
          </SheetHeader>
          <form className="flex flex-1 flex-col overflow-y-auto px-4 pb-4" onSubmit={handleCreateBeban}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="beban-date-display">Tanggal</Label>
                <Input
                  id="beban-date-display"
                  value={selectedDates[activeSectionKey] ? formatDate(selectedDates[activeSectionKey] as Date) : "-"}
                  disabled
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
                        formState.time === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <input
                        type="radio"
                        name="beban-time"
                        value={slot}
                        checked={formState.time === slot}
                        onChange={() => setFormState((current) => ({ ...current, time: slot }))}
                        className="sr-only"
                      />
                      {slot}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="beban-bay">Bay</Label>
                <Input id="beban-bay" value={selectedBayName} disabled />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="beban-tap">Tap</Label>
                  <Input
                    id="beban-tap"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formState.tap}
                    onChange={(event) => updateFormField("tap", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beban-kv">kV</Label>
                  <Input
                    id="beban-kv"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formState.kV}
                    onChange={(event) => updateFormField("kV", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beban-a">A</Label>
                  <Input
                    id="beban-a"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formState.ampere}
                    onChange={(event) => updateFormField("ampere", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beban-mw">MW</Label>
                  <Input
                    id="beban-mw"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formState.mw}
                    onChange={(event) => updateFormField("mw", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beban-mvar">MVAR</Label>
                  <Input
                    id="beban-mvar"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formState.mvar}
                    onChange={(event) => updateFormField("mvar", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="beban-percentage">Percentage In</Label>
                  <Input
                    id="beban-percentage"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={formState.percentageIn}
                    onChange={(event) => updateFormField("percentageIn", event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="px-0 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !currentBayId}>
                {isSaving ? "Saving..." : "Save Beban"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  };

  const renderSectionPanel = (section: SectionConfig) => {
    const sectionUnits = getUnitsBySection(section.key);
    const sectionBays = getBaysBySection(section.key);
    const filteredList = getFilteredBebanList(section.key);

    return (
      <TabsContent key={section.key} value={section.key} className="mt-0">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Unit</p>
                <Select
                  value={selectedUnitIds[section.key]}
                  onValueChange={(value) =>
                    setSelectedUnitIds((current) => ({ ...current, [section.key]: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionUnits.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Bay</p>
                <Select
                  value={selectedBayIds[section.key]}
                  onValueChange={(value) =>
                    setSelectedBayIds((current) => ({ ...current, [section.key]: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionBays.map((bay) => (
                      <SelectItem key={bay.id} value={String(bay.id)}>
                        {bay.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDates[section.key]}
                onSelect={(value) => setSelectedDates((current) => ({ ...current, [section.key]: value }))}
                className="w-full"
              />
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">List Beban</p>
                {filteredList.length > 0 ? (
                  <div className="space-y-3">
                    {filteredList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent/40"
                        onClick={() => openDetail(item)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{getMeasuredTimeSlot(item.measuredAt)}</Badge>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.bayName ?? "-"}</span>
                            <span className="text-xs text-muted-foreground">Tap to view detail</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Percentage In</p>
                          <p className="text-sm font-semibold">{item.percentage.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Belum ada data untuk filter saat ini.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    );
  };

  return (
    <DashboardShell title="Beban">
      <div className="space-y-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadData()} disabled={isLoading}>
            {isLoading ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCcwIcon />}
            Refresh
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <Tabs
          value={activePrimaryTab}
          onValueChange={(value) => setActivePrimaryTab(value as PrimaryTabKey)}
          className="gap-4"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {primaryTabConfig.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="min-w-fit px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {primaryTabConfig.map((primaryTab) => {
            const sections = getSectionsForPrimaryTab(primaryTab.key);
            return (
              <TabsContent key={primaryTab.key} value={primaryTab.key} className="mt-0 space-y-4">
                <Tabs
                  value={activeNestedTabs[primaryTab.key]}
                  onValueChange={(value) =>
                    setActiveNestedTabs((current) => ({
                      ...current,
                      [primaryTab.key]: value as SecondaryTabKey,
                    }))
                  }
                  className="gap-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <TabsList className="w-full justify-start overflow-x-auto lg:w-auto">
                      {sections.map((section) => (
                        <TabsTrigger key={section.key} value={section.key} className="min-w-fit px-4">
                          {section.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {renderFormTrigger()}
                  </div>
                  {sections.map((section) => renderSectionPanel(section))}
                </Tabs>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <Drawer
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
            setDetailForm(null);
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="max-h-[88dvh] overflow-hidden">
          {selectedItem && detailForm ? (
            <>
              <DrawerHeader>
                <DrawerTitle>Detail Beban</DrawerTitle>
                <DrawerDescription>
                  {selectedItem.bayName ?? "-"} pada {formatDate(getMeasuredDate(selectedItem.measuredAt))} jam{" "}
                  {getMeasuredTimeSlot(selectedItem.measuredAt)}
                </DrawerDescription>
              </DrawerHeader>
              <div className="max-h-[calc(88dvh-100px)] overflow-y-auto px-4 pb-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="detail-date">Tanggal</Label>
                    <Input
                      id="detail-date"
                      type="date"
                      value={detailForm.date}
                      onChange={(event) => updateDetailField("date", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-time">Jam</Label>
                    <Select
                      value={detailForm.time}
                      onValueChange={(value) => {
                        if (isTimeSlot(value)) {
                          updateDetailField("time", value);
                        }
                      }}
                    >
                      <SelectTrigger id="detail-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-tap">Tap</Label>
                    <Input
                      id="detail-tap"
                      type="number"
                      step="0.01"
                      value={detailForm.tap}
                      onChange={(event) => updateDetailField("tap", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-kv">kV</Label>
                    <Input
                      id="detail-kv"
                      type="number"
                      step="0.01"
                      value={detailForm.kV}
                      onChange={(event) => updateDetailField("kV", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-a">A</Label>
                    <Input
                      id="detail-a"
                      type="number"
                      step="0.01"
                      value={detailForm.ampere}
                      onChange={(event) => updateDetailField("ampere", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-mw">MW</Label>
                    <Input
                      id="detail-mw"
                      type="number"
                      step="0.01"
                      value={detailForm.mw}
                      onChange={(event) => updateDetailField("mw", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-mvar">MVAR</Label>
                    <Input
                      id="detail-mvar"
                      type="number"
                      step="0.01"
                      value={detailForm.mvar}
                      onChange={(event) => updateDetailField("mvar", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-percentage">Percentage In</Label>
                    <Input
                      id="detail-percentage"
                      type="number"
                      step="0.01"
                      value={detailForm.percentageIn}
                      onChange={(event) => updateDetailField("percentageIn", event.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => void handleUpdateBeban()} disabled={isSaving}>
                    <SaveIcon />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDeleteBeban()}
                    disabled={isSaving}
                  >
                    <Trash2Icon />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </DashboardShell>
  );
}
