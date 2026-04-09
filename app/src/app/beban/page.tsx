"use client";

import * as React from "react";
import { LoaderCircleIcon, PlusIcon, RefreshCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";

import {
  createBeban,
  deleteBeban,
  getBays,
  getBebans,
  getUnits,
  getUnitCategories,
  updateBeban,
  type Bay,
  type Beban,
  type Unit,
  type UnitCategory,
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
import { cn } from "@/shared/lib/utils";

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

export default function BebanPage() {
  const { token } = useAppRouter();
  
  // Dynamic category selection
  const [categories, setCategories] = React.useState<UnitCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
  
  // Unit selection based on category
  const [selectedUnitId, setSelectedUnitId] = React.useState<string>("");
  
  // Bay selection
  const [selectedBayId, setSelectedBayId] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  
  // Data
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [bays, setBays] = React.useState<Bay[]>([]);
  const [bebans, setBebans] = React.useState<Beban[]>([]);
  
  // UI state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formState, setFormState] = React.useState<BebanFormState>(createDefaultFormState());
  const [detailForm, setDetailForm] = React.useState<DetailFormState | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<Beban | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filtered data based on selections
  const filteredUnits = React.useMemo(() => {
    if (!selectedCategoryId) return [];
    return units.filter((unit) => String(unit.categoryId) === selectedCategoryId);
  }, [units, selectedCategoryId]);

  const filteredBays = React.useMemo(() => {
    if (!selectedUnitId) return [];
    return bays.filter((bay) => String(bay.unitId) === selectedUnitId);
  }, [bays, selectedUnitId]);

  const selectedBayName = React.useMemo(() => {
    return bays.find((bay) => String(bay.id) === selectedBayId)?.name ?? "";
  }, [bays, selectedBayId]);

  const selectedUnitName = React.useMemo(() => {
    return units.find((unit) => String(unit.id) === selectedUnitId)?.name ?? "";
  }, [units, selectedUnitId]);

  const selectedCategoryName = React.useMemo(() => {
    return categories.find((cat) => String(cat.id) === selectedCategoryId)?.name ?? "";
  }, [categories, selectedCategoryId]);

  // Load all data
  const loadData = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const [fetchedCategories, fetchedUnits, fetchedBays, fetchedBebans] = await Promise.all([
        getUnitCategories(token),
        getUnits(token),
        getBays(token),
        getBebans(token),
      ]);
      setCategories(fetchedCategories);
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

  // Reset downstream selections when category changes
  React.useEffect(() => {
    setSelectedUnitId("");
    setSelectedBayId("");
  }, [selectedCategoryId]);

  // Reset bay selection when unit changes
  React.useEffect(() => {
    setSelectedBayId("");
  }, [selectedUnitId]);

  // Auto-select first unit when category changes and units are loaded
  React.useEffect(() => {
    if (filteredUnits.length > 0 && !selectedUnitId) {
      setSelectedUnitId(String(filteredUnits[0].id));
    }
  }, [filteredUnits, selectedUnitId]);

  // Auto-select first bay when unit changes and bays are loaded
  React.useEffect(() => {
    if (filteredBays.length > 0 && !selectedBayId) {
      setSelectedBayId(String(filteredBays[0].id));
    }
  }, [filteredBays, selectedBayId]);

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

    if (!selectedBayId) {
      setError("Pilih bay terlebih dahulu");
      return;
    }

    const dateKey = toDateKey(selectedDate ?? new Date());

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

  const getFilteredBebanList = React.useCallback(() => {
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
  }, [bebans, selectedBayId, selectedDate]);

  const filteredBebanList = getFilteredBebanList();

  const renderFormTrigger = () => {
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
          disabled={!selectedBayId}
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
                  value={selectedDate ? formatDate(selectedDate) : "-"}
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
              <Button type="submit" disabled={isSaving || !selectedBayId}>
                {isSaving ? "Saving..." : "Save Beban"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
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

        {/* Selection Panel */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Category Dropdown */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Dropdown */}
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                  disabled={!selectedCategoryId || filteredUnits.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCategoryId ? "Pilih unit" : "Pilih kategori dulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUnits.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bay Dropdown */}
              <div className="space-y-2">
                <Label>Bay</Label>
                <Select
                  value={selectedBayId}
                  onValueChange={setSelectedBayId}
                  disabled={!selectedUnitId || filteredBays.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedUnitId ? "Pilih bay" : "Pilih unit dulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBays.map((bay) => (
                      <SelectItem key={bay.id} value={String(bay.id)}>
                        {bay.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Info */}
            {selectedCategoryId && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Kategori: <strong className="text-foreground">{selectedCategoryName}</strong></span>
                {selectedUnitId && (
                  <>
                    <span>•</span>
                    <span>Unit: <strong className="text-foreground">{selectedUnitName}</strong></span>
                  </>
                )}
                {selectedBayId && (
                  <>
                    <span>•</span>
                    <span>Bay: <strong className="text-foreground">{selectedBayName}</strong></span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">List Beban</p>
                {renderFormTrigger()}
              </div>
              
              {filteredBebanList.length > 0 ? (
                <div className="space-y-3">
                  {filteredBebanList.map((item) => (
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
                  {!selectedBayId 
                    ? "Pilih kategori, unit, dan bay terlebih dahulu." 
                    : "Belum ada data untuk filter saat ini."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
