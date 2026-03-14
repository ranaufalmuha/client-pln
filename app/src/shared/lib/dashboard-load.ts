export type TimeSlot = "10:00" | "14:00" | "19:00";
export type BayKey = "cilegon" | "depok1" | "depok2" | "saguling1";

export type DashboardSnapshot = {
  date: string;
  time: TimeSlot;
  bay: BayKey;
  ampere: number;
  kV: number;
  mw: number;
  kvar: number;
};

export type PeakAmperePoint = {
  date: string;
} & Record<BayKey, number>;

const dashboardBays: Record<
  BayKey,
  { label: string; baseAmpere: number; baseKV: number }
> = {
  cilegon: { label: "Cilegon", baseAmpere: 316, baseKV: 149.7 },
  depok1: { label: "Depok 1", baseAmpere: 298, baseKV: 149.5 },
  depok2: { label: "Depok 2", baseAmpere: 334, baseKV: 149.9 },
  saguling1: { label: "Saguling 1", baseAmpere: 276, baseKV: 149.4 },
};

const dayMultipliers = [0.96, 0.98, 1.01, 1.03, 1.0, 1.04, 1.06, 1.08, 1.05];
const timeMultipliers: Record<TimeSlot, number> = {
  "10:00": 0.93,
  "14:00": 1.0,
  "19:00": 1.09,
};

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildDashboardDates() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - (dayMultipliers.length - 1));

  return Array.from({ length: dayMultipliers.length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateKey(date);
  });
}

export const dashboardDates = buildDashboardDates();

export const bayDefinitions = (
  Object.entries(dashboardBays) as Array<
    [BayKey, { label: string; baseAmpere: number; baseKV: number }]
  >
).map(([key, value]) => ({
  key,
  label: value.label,
}));

export function getBayLabel(bay: BayKey) {
  return dashboardBays[bay].label;
}

export const dashboardSnapshots: DashboardSnapshot[] = dashboardDates.flatMap(
  (date, dayIndex) =>
    bayDefinitions.flatMap((bayDefinition, bayIndex) =>
      (Object.keys(timeMultipliers) as TimeSlot[]).map((time, timeIndex) => {
        const bay = dashboardBays[bayDefinition.key];
        const ampere = roundToTwo(
          bay.baseAmpere * dayMultipliers[dayIndex] * timeMultipliers[time] +
            (bayIndex + 1) * 1.2,
        );
        const kV = roundToTwo(
          bay.baseKV +
            (timeIndex === 2 ? 0.24 : timeIndex === 1 ? 0.1 : -0.08) +
            (dayIndex % 3 === 0 ? 0.05 : -0.03),
        );
        const mw = roundToTwo((1.732 * kV * ampere * 0.9) / 1000);
        const kvar = roundToTwo(mw * (0.16 + bayIndex * 0.01));

        return {
          date,
          time,
          bay: bayDefinition.key,
          ampere,
          kV,
          mw,
          kvar,
        };
      }),
    ),
);

export const latestDashboardDate = dashboardDates[dashboardDates.length - 1];

function getDateIndex(dateKey: string) {
  return dashboardDates.indexOf(dateKey);
}

export function normalizeDateRange(startDate: string, endDate: string) {
  const fallbackStart = dashboardDates[0];
  const fallbackEnd = latestDashboardDate;
  const startIndex = getDateIndex(startDate);
  const endIndex = getDateIndex(endDate);
  const safeStartIndex = startIndex === -1 ? 0 : startIndex;
  const safeEndIndex = endIndex === -1 ? dashboardDates.length - 1 : endIndex;

  if (safeStartIndex <= safeEndIndex) {
    return {
      startDate: dashboardDates[safeStartIndex] ?? fallbackStart,
      endDate: dashboardDates[safeEndIndex] ?? fallbackEnd,
    };
  }

  return {
    startDate: dashboardDates[safeEndIndex] ?? fallbackStart,
    endDate: dashboardDates[safeStartIndex] ?? fallbackEnd,
  };
}

export function getPeakAmpereByBayInRange(startDate: string, endDate: string) {
  const normalized = normalizeDateRange(startDate, endDate);
  const startIndex = getDateIndex(normalized.startDate);
  const endIndex = getDateIndex(normalized.endDate);

  return dashboardDates.slice(startIndex, endIndex + 1).map((date) => {
    const point: PeakAmperePoint = {
      date,
      cilegon: 0,
      depok1: 0,
      depok2: 0,
      saguling1: 0,
    };
    for (const bay of bayDefinitions) {
      const peakAmpere = dashboardSnapshots
        .filter((snapshot) => snapshot.date === date && snapshot.bay === bay.key)
        .reduce((max, snapshot) => Math.max(max, snapshot.ampere), 0);
      point[bay.key] = peakAmpere;
    }
    return point;
  });
}

export function getHighestLoadForDate(dateKey: string) {
  const dailyData = dashboardSnapshots.filter((snapshot) => snapshot.date === dateKey);

  if (!dailyData.length) {
    return null;
  }

  return dailyData.reduce((highest, snapshot) =>
    snapshot.ampere > highest.ampere ? snapshot : highest,
  );
}

export function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
