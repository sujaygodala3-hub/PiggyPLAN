// Import React hooks:
// - useState: manage component state
// - useEffect: subscribe/unsubscribe to store updates + run side effects
// - useMemo: memoize computed values (log parsing, graphs, filtered rows) for performance
import React, { useEffect, useMemo, useState } from "react";

// Import Material UI components used to build the page (layout, cards, table, inputs, etc.)
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  TextField,
  Typography,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  InputAdornment,
} from "@mui/material";

// Import your game store types + helpers for loading state and subscribing to changes
import { GameState, loadGameState, subscribeGameState } from "../components/store/gameStore";

/* =========================
   AUTUMN DARK THEME
   (keeps dark UI + autumn accents)
========================= */
// Create a custom MUI theme that forces dark mode and sets background/text defaults
const autumnTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#070710", // page background
      paper: "rgba(18,18,32,0.72)", // card/paper background
    },
    text: {
      primary: "#ffffff", // main text
      secondary: "rgba(255,255,255,0.78)", // muted text
    },
  },
  typography: {
    // Global font stack for this page/theme
    fontFamily:
      '"Space Grotesk","Monument",system-ui,-apple-system,"Segoe UI",Arial,sans-serif',
  },
});

/* -------------------- TYPES -------------------- */
// Shape for a single money log entry
type MoneyLogItem = {
  ts?: number;          // timestamp (ms since epoch)
  delta?: number;       // + earn, - spend (preferred)
  amount?: number;      // sometimes used instead of delta
  category?: string;    // category label (e.g., "Salon", "Restaurant")
  note?: string;        // extra details
};

// LocalStorage key for the savings “sub-account”
const SAVINGS_KEY = "petquest_savings_account";

/* -------------------- AUTUMN PALETTE -------------------- */
// Color tokens used throughout the UI for consistent “autumn” styling
const autumnGold = "#FF5DA2";      // main pink (numbers, highlights)
const autumnOrange = "#FF87C2";    // secondary pink
const autumnRust = "#FF3D8D";      // deeper pink
const autumnBrown = "#C2185B";     // dark pink
const autumnGlow = "rgba(255, 93, 162, 0.35)";
const borderSoft = "rgba(255, 93, 162, 0.25)";
const surfaceGlass = "rgba(0,0,0,0.22)";
const surfaceGlass2 = "rgba(0,0,0,0.28)";

/* -------------------- HELPERS -------------------- */
// Format a number into "$X" with commas, no decimals
const fmtMoney = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

/**
 * Extract a money log array from the store state.
 * - Supports multiple possible field names (moneyLog, ledger, transactions, etc.)
 * - Returns [] if none exist
 */
function getLogFromState(state: GameState): MoneyLogItem[] {
  const s: any = state;
  const candidates = [s.moneyLog, s.ledger, s.transactions, s.moneyHistory, s.history];
  return (candidates.find((x) => Array.isArray(x)) ?? []) as MoneyLogItem[];
}

/**
 * Get the numeric delta (change amount) from a log entry.
 * - Prefer entry.delta
 * - Fallback to entry.amount
 * - Otherwise return 0
 */
function getDelta(item: MoneyLogItem): number {
  if (typeof item.delta === "number") return item.delta;
  if (typeof item.amount === "number") return item.amount;
  return 0;
}

/**
 * Get timestamp from a log entry, returning 0 if missing/invalid.
 */
function getTs(item: MoneyLogItem): number {
  if (typeof item.ts === "number" && Number.isFinite(item.ts)) return item.ts;
  return 0;
}

/**
 * Format timestamp into MM/DD/YY HH:MM.
 * Returns "—" if no timestamp.
 */
function fmtDate(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yy} ${hh}:${mi}`;
}

/**
 * Read a number from localStorage safely.
 * Returns 0 if missing or invalid.
 */
function readLocalNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Write a non-negative integer to localStorage safely.
 */
function writeLocalNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    // ignore (storage blocked, etc.)
  }
}

/**
 * Build a searchable lowercase string from a log entry’s category + note.
 */
function textOf(entry: MoneyLogItem): string {
  return `${entry.category ?? ""} ${entry.note ?? ""}`.toLowerCase();
}

/**
 * Category detectors:
 * These are used to group transactions into your graphs.
 * (They use simple keyword matching on category/note.)
 */
function isToy(entry: MoneyLogItem): boolean {
  const t = textOf(entry);
  return t.includes("toy");
}
function isSalon(entry: MoneyLogItem): boolean {
  const t = textOf(entry);
  return t.includes("salon");
}
function isBathroom(entry: MoneyLogItem): boolean {
  const t = textOf(entry);
  return t.includes("bathroom") || t.includes("restroom");
}
function isRestaurant(entry: MoneyLogItem): boolean {
  const t = textOf(entry);
  return t.includes("restaurant") || t.includes("food") || t.includes("cafe");
}
function isHospital(entry: MoneyLogItem): boolean {
  const t = textOf(entry);
  return t.includes("hospital") || t.includes("clinic") || t.includes("doctor");
}

/* ---------- Better Bar Graph Component (still no recharts) ---------- */
// GraphItem represents one “bar” in the bar graph, including total value and transaction count
type GraphItem = { label: string; value: number; count: number };

/**
 * BetterBarGraph
 * - Renders a styled card with KPIs (Total, Transactions, Avg)
 * - Shows “biggest impact” category
 * - Draws simple bars using Box width percentages (no chart library needed)
 */
function BetterBarGraph({
  title,
  subtitle,
  items,
  kind,
}: {
  title: string;
  subtitle?: string;
  items: GraphItem[];
  kind: "spend" | "earn";
}) {
  // Total of all bar values
  const total = useMemo(() => items.reduce((a, b) => a + (b.value || 0), 0), [items]);

  // Total number of transactions across categories
  const totalCount = useMemo(() => items.reduce((a, b) => a + (b.count || 0), 0), [items]);

  // Find the max value to scale bar widths
  const max = Math.max(1, ...items.map((i) => i.value || 0));

  // Compute the top category by value (largest bar)
  const top = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.value || 0) - (a.value || 0));
    return sorted[0] ?? null;
  }, [items]);

  return (
    <Card
      sx={{
        // Card styling to match your dark glass UI
        borderRadius: 5,
        background: "rgba(18,18,32,0.72)",
        border: `1px solid ${borderSoft}`,
        boxShadow: "0 20px 55px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(14px)",
      }}
    >
      <CardContent>
        {/* Card title */}
        <Typography variant="h5" fontWeight={900}>
          {title}
        </Typography>

        {/* Optional subtitle */}
        {subtitle ? (
          <Typography sx={{ opacity: 0.85, mt: 0.5 }}>{subtitle}</Typography>
        ) : null}

        {/* KPI row (Total + Transactions/Avg) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.5,
            mt: 2,
          }}
        >
          {/* Total value KPI */}
          <Box
            sx={{
              p: 1.4,
              borderRadius: 3,
              border: `1px solid ${borderSoft}`,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography sx={{ opacity: 0.85, fontWeight: 900 }}>Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 950, color: autumnGold }}>
              {fmtMoney(total)}
            </Typography>
          </Box>

          {/* Count + average KPI */}
          <Box
            sx={{
              p: 1.4,
              borderRadius: 3,
              border: `1px solid ${borderSoft}`,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography sx={{ opacity: 0.85, fontWeight: 900 }}>Transactions</Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {totalCount}
              <Typography component="span" sx={{ ml: 1, opacity: 0.8, fontWeight: 800 }}>
                {totalCount ? `· avg ${fmtMoney(Math.round(total / totalCount))}` : ""}
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* Biggest impact line */}
        {top ? (
          <Typography sx={{ mt: 1.2, opacity: 0.9 }}>
            Biggest impact:{" "}
            <b style={{ color: autumnGold }}>{top.label}</b> ·{" "}
            <b>{fmtMoney(top.value)}</b>{" "}
            <span style={{ opacity: 0.85 }}>
              ({total ? Math.round((top.value / total) * 100) : 0}%)
            </span>
          </Typography>
        ) : null}

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.18)" }} />

        {/* Bar list */}
        <Box sx={{ display: "grid", gap: 1.6 }}>
          {items.map((it) => {
            // Bar width as a percentage of the max item (minimum visible width of 2%)
            const pct = Math.max(2, Math.round(((it.value || 0) / max) * 100));

            // Share as a percentage of total
            const share = total ? Math.round(((it.value || 0) / total) * 100) : 0;

            return (
              <Box key={it.label}>
                {/* Row header for each bar */}
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography sx={{ fontWeight: 950 }}>{it.label}</Typography>
                    <Typography sx={{ opacity: 0.8, fontWeight: 800 }}>
                      · {it.count} tx · {share}%
                    </Typography>
                  </Box>

                  <Typography sx={{ fontWeight: 950, color: autumnGold }}>
                    {fmtMoney(it.value || 0)}
                  </Typography>
                </Box>

                {/* Bar background */}
                <Box
                  sx={{
                    mt: 0.9,
                    height: 12,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.16)",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {/* Actual bar fill */}
                  <Box
                    sx={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 999,
                      background:
                        kind === "earn"
                          ? `linear-gradient(90deg, ${autumnGold}, ${autumnOrange})`
                          : `linear-gradient(90deg, ${autumnOrange}, ${autumnRust}, ${autumnBrown})`,
                      boxShadow: `0 10px 22px ${autumnGlow}`,
                    }}
                  />
                </Box>
              </Box>
            );
          })}

          {/* Empty state when no graph data */}
          {items.length === 0 ? (
            <Typography sx={{ opacity: 0.85 }}>
              No data yet — do some activities/purchases on the map first.
            </Typography>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}

/* -------------------- PAGE -------------------- */
// Transactions page component
export default function TranPage(): React.ReactElement {
  // Local copy of game state, synced with your store
  const [state, setState] = useState<GameState>(() => loadGameState());

  // Savings Account (actual deposited money, stored in localStorage)
  const [savingsBalance, setSavingsBalance] = useState<number>(() => readLocalNumber(SAVINGS_KEY));
  const [depositInput, setDepositInput] = useState<string>("");

  // Table filters (search inputs)
  const [categoryQuery, setCategoryQuery] = useState<string>("");
  const [timeQuery, setTimeQuery] = useState<string>("");

  // Subscribe to store updates on mount and keep local state synced
  useEffect(() => {
    setState(loadGameState());
    return subscribeGameState(setState);
  }, []);

  // Current money from the store (fallback to 0)
  const money = state.money ?? 0;

  // Money log extracted from whatever field exists in the store
  const log = useMemo(() => getLogFromState(state), [state]);

  /* -------- Graph data (now includes counts + better insight) -------- */

  // Negative purchases: Salon + Toy Store (spending only)
  const negativePurchases: GraphItem[] = useMemo(() => {
    let salon = 0;
    let toy = 0;
    let salonCount = 0;
    let toyCount = 0;

    // Walk log entries and sum negative deltas into categories
    for (const entry of log) {
      const d = getDelta(entry);
      if (d >= 0) continue; // spending only
      const amt = Math.abs(d);

      if (isSalon(entry)) {
        salon += amt;
        salonCount += 1;
      }
      if (isToy(entry)) {
        toy += amt;
        toyCount += 1;
      }
    }

    // Return as graph items
    return [
      { label: "Salon", value: salon, count: salonCount },
      { label: "Toy Store", value: toy, count: toyCount },
    ];
  }, [log]);

  // Positive activities: Bathroom + Restaurant + Hospital (earning only)
  const positiveActivities: GraphItem[] = useMemo(() => {
    let bathroom = 0;
    let restaurant = 0;
    let hospital = 0;

    let bathroomCount = 0;
    let restaurantCount = 0;
    let hospitalCount = 0;

    // Walk log entries and sum positive deltas into categories
    for (const entry of log) {
      const d = getDelta(entry);
      if (d <= 0) continue; // earnings only
      const amt = d;

      if (isBathroom(entry)) {
        bathroom += amt;
        bathroomCount += 1;
      }
      if (isRestaurant(entry)) {
        restaurant += amt;
        restaurantCount += 1;
      }
      if (isHospital(entry)) {
        hospital += amt;
        hospitalCount += 1;
      }
    }

    // Return as graph items
    return [
      { label: "Bathroom", value: bathroom, count: bathroomCount },
      { label: "Restaurant", value: restaurant, count: restaurantCount },
      { label: "Hospital", value: hospital, count: hospitalCount },
    ];
  }, [log]);

  /* -------- Table rows w/ running balance + FAKE TIME LABEL -------- */
  const tableRows = useMemo(() => {
    // If there’s no log, show nothing
    if (!log.length) return [];

    // Sort log oldest -> newest for running balance calculation
    const sorted = [...log].sort((a, b) => getTs(a) - getTs(b));

    // Infer starting balance so the last running balance equals current money
    const totalDelta = sorted.reduce((acc, it) => acc + getDelta(it), 0);
    let running = money - totalDelta;

    // Build rows and compute running balance after each transaction
    const rows = sorted.map((it, idx) => {
      running += getDelta(it);

      // Create a "fake" session label for display/search
      // Newest will become Session 1 after we reverse
      const fakeSession = `Session ${sorted.length - idx}`;

      return {
        id: `${getTs(it)}-${idx}`,
        // Store both real and fake time values
        whenReal: fmtDate(getTs(it)),
        when: fakeSession,
        category: it.category ?? "—",
        note: it.note ?? "—",
        delta: getDelta(it),
        running,
      };
    });

    // Reverse so newest rows appear first (Session 1 at the top)
    return rows.reverse();
  }, [log, money]);

  /* -------- Filtered rows (category + time) -------- */
  const filteredRows = useMemo(() => {
    const cq = categoryQuery.trim().toLowerCase();
    const tq = timeQuery.trim().toLowerCase();

    // No filters -> return all rows
    if (!cq && !tq) return tableRows;

    // Filter rows by category/note and/or by time label
    return tableRows.filter((r) => {
      const categoryMatch = !cq
        ? true
        : `${r.category} ${r.note}`.toLowerCase().includes(cq);

      const timeMatch = !tq ? true : `${r.when} ${r.whenReal}`.toLowerCase().includes(tq);

      return categoryMatch && timeMatch;
    });
  }, [tableRows, categoryQuery, timeQuery]);

  /* ============================
     SAVINGS ACCOUNT (LOCAL)
     - Deposit: moves money from "main" to "savings"
     - Withdraw all: moves savings back into main
     ============================ */

  // Main money available to spend after subtracting savings “locked” amount
  const availableMain = Math.max(0, Math.floor(money - savingsBalance));

  // If user spends money elsewhere and savings becomes bigger than money, clamp it
  useEffect(() => {
    // Keep savings from exceeding main money if user refreshes after spending
    if (savingsBalance > money) {
      setSavingsBalance(money);
      writeLocalNumber(SAVINGS_KEY, money);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [money]);

  /**
   * Deposit to savings:
   * - sanitize input to digits only
   * - cap deposit by availableMain
   * - store the updated savings balance to localStorage
   */
  const depositToSavings = () => {
    const clean = depositInput.replace(/[^\d]/g, "");
    const amt = Number(clean);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const capped = Math.min(amt, availableMain);
    const next = savingsBalance + capped;

    setSavingsBalance(next);
    writeLocalNumber(SAVINGS_KEY, next);
    setDepositInput("");
  };

  /**
   * Withdraw all:
   * - reset savings to 0 (puts it “back into main” by making availableMain bigger)
   */
  const withdrawAllToMain = () => {
    setSavingsBalance(0);
    writeLocalNumber(SAVINGS_KEY, 0);
  };

  /* -------------------- UI -------------------- */
  return (
    // Apply theme to the whole page
    <ThemeProvider theme={autumnTheme}>
      <CssBaseline />
      {/* Normalize CSS baseline for consistent styling */}
      <CssBaseline />

      {/* Page background wrapper */}
      <Box
        sx={{
          minHeight: "100vh",
          py: 6,
          background: `
            radial-gradient(1200px 700px at 15% -10%, rgba(255, 93, 162, 0.22), transparent 60%),
            radial-gradient(900px 520px at 100% 0%, rgba(255, 135, 194, 0.18), transparent 55%),
            linear-gradient(180deg, #070710, #0C0C16)
          `,
        }}
      >
        <Container maxWidth="lg">
          {/* Page title */}
          <Typography
            variant="h3"
            align="center"
            fontWeight={900}
            sx={{ color: "text.primary" }}
          >
            Transactions & Insights
          </Typography>

          {/* TOP ROW: Balance + two graphs */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 2,
              mt: 4,
              alignItems: "stretch",
            }}
          >
            {/* Current Balance card */}
            <Card
              sx={{
                borderRadius: 5,
                background: "rgba(18,18,32,0.72)",
                border: `1px solid ${borderSoft}`,
                boxShadow: "0 20px 55px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter: "blur(14px)",
              }}
            >
              <CardContent>
                <Typography sx={{ opacity: 0.9 }}>Current Balance (In-Game)</Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: autumnGold }}>
                  {fmtMoney(money)}
                </Typography>

                <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.18)" }} />

                <Typography sx={{ opacity: 0.9 }}>Available Main (after Savings)</Typography>
                <Typography variant="h5" fontWeight={900}>
                  {fmtMoney(availableMain)}
                </Typography>
              </CardContent>
            </Card>

            {/* Spending graph */}
            <BetterBarGraph
              title="Negative Purchases"
              subtitle="Money spent at Salon + Toy Store"
              items={negativePurchases}
              kind="spend"
            />

            {/* Earning graph */}
            <BetterBarGraph
              title="Positive Activities"
              subtitle="Money earned at Bathroom, Restaurant, Hospital"
              items={positiveActivities}
              kind="earn"
            />
          </Box>

          {/* SAVINGS ACCOUNT BOX */}
          <Card
            sx={{
              mt: 4,
              borderRadius: 5,
              background: "rgba(18,18,32,0.72)",
              border: `1px solid ${borderSoft}`,
              boxShadow: "0 20px 55px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(14px)",
            }}
          >
            <CardContent>
              {/* Savings heading */}
              <Typography variant="h5" fontWeight={900}>
                Savings Account
              </Typography>
              <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
                Deposit money here to “lock it away” from spending. Withdraw returns it to your main account.
              </Typography>

              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.18)" }} />

              {/* Savings layout: left (deposit) + right (withdraw) */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                  gap: 2,
                  alignItems: "start",
                }}
              >
                {/* Savings balance + deposit */}
                <Card
                  sx={{
                    backgroundColor: surfaceGlass,
                    border: `1px solid ${borderSoft}`,
                    borderRadius: 4,
                  }}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 900 }}>Savings Balance</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, color: autumnGold }}>
                      {fmtMoney(savingsBalance)}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.18)" }} />

                    <Typography sx={{ fontWeight: 900 }}>Deposit Amount</Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <TextField
                        value={depositInput}
                        onChange={(e) => setDepositInput(e.target.value)}
                        placeholder="e.g. 50"
                        fullWidth
                        inputProps={{ inputMode: "numeric" }}
                        sx={{
                          "& .MuiInputBase-root": {
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.04)",
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={depositToSavings}
                        sx={{
                          fontWeight: 950,
                          borderRadius: 999,
                          px: 2.5,
                          color: "#111",
                          background: `linear-gradient(135deg, ${autumnGold}, ${autumnOrange})`,
                          boxShadow: `0 14px 30px ${autumnGlow}`,
                          "&:hover": {
                            background: `linear-gradient(135deg, ${autumnOrange}, ${autumnGold})`,
                          },
                        }}
                      >
                        Deposit
                      </Button>
                    </Box>

                    <Typography sx={{ mt: 1.2, opacity: 0.9 }}>
                      Max you can deposit right now: <b>{fmtMoney(availableMain)}</b>
                    </Typography>
                  </CardContent>
                </Card>

                {/* Withdraw all */}
                <Card
                  sx={{
                    backgroundColor: surfaceGlass,
                    border: `1px solid ${borderSoft}`,
                    borderRadius: 4,
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 900 }}>Withdraw</Typography>
                    <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
                      Click to move all savings back into your main account.
                    </Typography>

                    <Button
                      onClick={withdrawAllToMain}
                      disabled={savingsBalance <= 0}
                      variant="outlined"
                      sx={{
                        mt: 2,
                        fontWeight: 950,
                        borderRadius: 999,
                        borderColor: "rgba(217,122,43,0.65)",
                        color: "rgba(255,255,255,0.92)",
                        background: "rgba(255,255,255,0.02)",
                        "&:hover": {
                          background: `linear-gradient(135deg, rgba(178,74,42,0.28), rgba(217,122,43,0.16))`,
                          borderColor: "rgba(232,211,106,0.70)",
                        },
                      }}
                      fullWidth
                    >
                      Withdraw All to Main
                    </Button>

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.18)" }} />

                    <Typography sx={{ opacity: 0.9 }}>
                      After withdraw, Available Main will return to:
                    </Typography>
                    <Typography sx={{ fontWeight: 900, mt: 0.5, color: autumnGold }}>
                      {fmtMoney(Math.floor(money))}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </CardContent>
          </Card>

          {/* TRANSACTIONS TABLE */}
          <Card
            sx={{
              mt: 4,
              borderRadius: 5,
              background: "rgba(18,18,32,0.72)",
              border: `1px solid ${borderSoft}`,
              boxShadow: "0 20px 55px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(14px)",
            }}
          >
            <CardContent>
              {/* Table title */}
              <Typography variant="h5" fontWeight={900}>
                Money Log (Adds/Subtracts)
              </Typography>
              <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
                Shows each time money changes (earnings from activities or spending on purchases).
              </Typography>

              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.18)" }} />

              {/* SEARCH CONTROLS */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
                  gap: 1.5,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                {/* Category/Note search */}
                <TextField
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Search category or note (e.g. salon, toy, food)"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">🔎</InputAdornment>,
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.04)",
                    },
                  }}
                />

                {/* Time search (Session labels or real time) */}
                <TextField
                  value={timeQuery}
                  onChange={(e) => setTimeQuery(e.target.value)}
                  placeholder='Search time (e.g. "Session 1", "Session 12")'
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">⏱️</InputAdornment>,
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.04)",
                    },
                  }}
                />

                {/* Clear filters button */}
                <Button
                  onClick={() => {
                    setCategoryQuery("");
                    setTimeQuery("");
                  }}
                  variant="outlined"
                  sx={{
                    height: 44,
                    fontWeight: 950,
                    borderRadius: 999,
                    borderColor: "rgba(217,122,43,0.65)",
                    color: "rgba(255,255,255,0.92)",
                    background: "rgba(255,255,255,0.02)",
                    "&:hover": {
                      background: `linear-gradient(135deg, rgba(178,74,42,0.28), rgba(217,122,43,0.16))`,
                      borderColor: "rgba(232,211,106,0.70)",
                    },
                  }}
                >
                  Clear
                </Button>
              </Box>

              {/* Row counts */}
              <Typography sx={{ mb: 1.5, opacity: 0.85 }}>
                Showing <b>{filteredRows.length}</b> / {tableRows.length} entries
              </Typography>

              {/* Table container */}
              <TableContainer
                component={Paper}
                sx={{
                  backgroundColor: surfaceGlass2,
                  border: `1px solid ${borderSoft}`,
                  color: "text.primary",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Note</TableCell>
                      <TableCell sx={{ fontWeight: 900 }} align="right">
                        Change
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900 }} align="right">
                        Balance After
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {/* Empty filtered state */}
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography>
                            No matches. Try a different category/note keyword or a time like “Session 1”.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Render each row
                      filteredRows.map((r) => {
                        const isEarn = r.delta >= 0; // earnings vs spending
                        return (
                          <TableRow key={r.id} hover>
                            <TableCell>
                              {/* Fake time label for searching/UX */}
                              <Typography sx={{ fontWeight: 900 }}>{r.when}</Typography>
                              <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                                {/* Keep a subtle “real” timestamp for debugging (optional) */}
                                {r.whenReal}
                              </Typography>
                            </TableCell>

                            <TableCell>{r.category}</TableCell>
                            <TableCell>{r.note}</TableCell>

                            {/* Delta chip */}
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={`${isEarn ? "+" : "-"}${fmtMoney(Math.abs(r.delta))}`}
                                sx={{
                                  fontWeight: 900,
                                  color: "#fff",
                                  backgroundColor: isEarn
                                    ? "rgba(255, 93, 162, 0.22)"
                                    : "rgba(194, 24, 91, 0.28)",
                                  border: isEarn
                                    ? "1px solid rgba(255, 93, 162, 0.6)"
                                    : "1px solid rgba(255, 61, 141, 0.6)",
                                }}
                              />
                            </TableCell>

                            {/* Running balance */}
                            <TableCell align="right" sx={{ fontWeight: 900, color: autumnGold }}>
                              {fmtMoney(r.running)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Note for improving filters */}
              <Typography sx={{ mt: 2, opacity: 0.85 }}>
                If any location names don’t match your log exactly, tell me what your log uses (the exact Category/Note
                strings) and I’ll update the filters so the graphs match perfectly.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
