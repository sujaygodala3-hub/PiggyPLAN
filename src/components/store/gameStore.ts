/* =========================
   TYPES
========================= */
export type AnimalId =
  | "pig"
  | "dog"
  | "cat"
  | "fox"
  | "bunny"
  | "unicorn"
  | "snake"
  | "panda"
  | "dragon";

export type AccessoryId = "collar" | "leash" | "headband";
export type TxType = "income" | "expense";

export type NeedId = "hunger" | "thirst" | "health" | "fun" | "sleep";
export type Needs = Record<NeedId, number>;

export type Transaction = {
  id: string;
  createdAt: number;
  type: TxType;
  amount: number;
  category: string;
  note: string;
};

export type EquippedAccessories = Record<AccessoryId, boolean>;
export type OwnedAccessories = Record<AccessoryId, number>;
export type OwnedPets = Record<AnimalId, boolean>;

export type Badges = {
  accessory_1: boolean;
  accessory_2: boolean;
  accessory_4: boolean;
  days_5: boolean;
  days_10: boolean;
  days_15: boolean;
  days_25: boolean;
  days_50: boolean;
  days_100: boolean;
};

export type GameState = {
  needs: Needs;

  money: number;
  animalId: AnimalId;

  ownedPets: OwnedPets;

  ownedAccessories: OwnedAccessories;
  equippedAccessories: EquippedAccessories;

  badges: Badges;
  daysPlayed: number;

  transactions: Transaction[];
};

/* =========================
   STORAGE KEYS
========================= */
const STORAGE_KEY = "finwise_game_v1";

// ✅ Per-pet ages live outside of the main state (but still in localStorage)
const PET_AGES_KEY = "petquest_pet_ages_v1";
type PetAges = Partial<Record<AnimalId, number>>;

/* =========================
   DEFAULT STATE
========================= */
const defaultState: GameState = {
  needs: { hunger: 0, thirst: 0, health: 0, fun: 0, sleep: 0 },

  money: 0,
  animalId: "dog",

  ownedPets: {
    pig: true,
    dog: true,
    cat: true,
    fox: true,
    bunny: true,
    unicorn: false,
    snake: false,
    panda: false,
    dragon: false,
  },

  ownedAccessories: { collar: 0, leash: 0, headband: 0 },
  equippedAccessories: { collar: false, leash: false, headband: false },

  badges: {
    accessory_1: false,
    accessory_2: false,
    accessory_4: false,
    days_5: false,
    days_10: false,
    days_15: false,
    days_25: false,
    days_50: false,
    days_100: false,
  },

  daysPlayed: 0,
  transactions: [],
};

/* =========================
   HELPERS
========================= */
function safeParse(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clampNeed(v: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampNeeds(needs: Partial<Needs> | undefined | null): Needs {
  const base = { ...defaultState.needs, ...(needs ?? {}) } as Needs;
  return {
    hunger: clampNeed(base.hunger),
    thirst: clampNeed(base.thirst),
    health: clampNeed(base.health),
    fun: clampNeed(base.fun),
    sleep: clampNeed(base.sleep),
  };
}

function normalize(s: GameState): GameState {
  const anyS = s as any;

  return {
    ...defaultState,
    ...s,

    ownedPets: { ...defaultState.ownedPets, ...(s.ownedPets ?? {}) },
    ownedAccessories: { ...defaultState.ownedAccessories, ...(s.ownedAccessories ?? {}) },
    equippedAccessories: { ...defaultState.equippedAccessories, ...(s.equippedAccessories ?? {}) },
    badges: { ...defaultState.badges, ...(s.badges ?? {}) },

    // ✅ FIX: merge needs safely (never spread undefined)
    needs: clampNeeds(anyS.needs),

    transactions: Array.isArray(s.transactions) ? (s.transactions as Transaction[]) : [],
    money: Math.max(0, Number(s.money) || 0),
    daysPlayed: Math.max(0, Number(s.daysPlayed) || 0),
    animalId: (s.animalId as AnimalId) ?? defaultState.animalId,
  };
}

function totalAccessoriesOwned(o: OwnedAccessories): number {
  return (o.collar ?? 0) + (o.leash ?? 0) + (o.headband ?? 0);
}

function computeBadges(s: GameState): Badges {
  const acc = totalAccessoriesOwned(s.ownedAccessories);
  const d = s.daysPlayed;

  return {
    accessory_1: acc >= 1,
    accessory_2: acc >= 2,
    accessory_4: acc >= 4,
    days_5: d >= 5,
    days_10: d >= 10,
    days_15: d >= 15,
    days_25: d >= 25,
    days_50: d >= 50,
    days_100: d >= 100,
  };
}

/* ===== Pet Ages helpers ===== */
function loadPetAges(): PetAges {
  try {
    const raw = localStorage.getItem(PET_AGES_KEY);
    return raw ? (JSON.parse(raw) as PetAges) : {};
  } catch {
    return {};
  }
}

function savePetAges(ages: PetAges) {
  try {
    localStorage.setItem(PET_AGES_KEY, JSON.stringify(ages));
  } catch {
    // ignore
  }
}

function allNeedsComplete(needs: Needs): boolean {
  return (
    (needs.hunger ?? 0) >= 100 &&
    (needs.thirst ?? 0) >= 100 &&
    (needs.health ?? 0) >= 100 &&
    (needs.fun ?? 0) >= 100 &&
    (needs.sleep ?? 0) >= 100
  );
}

/* =========================
   STATE + SUBSCRIPTION
========================= */
type Listener = (next: GameState) => void;
const listeners: Listener[] = [];

let state: GameState = (() => {
  const loaded =
    typeof window !== "undefined" ? safeParse(localStorage.getItem(STORAGE_KEY)) : null;

  const base = loaded ? normalize(loaded) : defaultState;

  // ✅ Always derive badges on boot
  return { ...base, badges: computeBadges(base) };
})();

function persist(nextRaw: GameState) {
  const normalized = normalize(nextRaw);
  const next: GameState = { ...normalized, badges: computeBadges(normalized) };

  state = next;

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore storage errors
  }

  listeners.forEach((l) => l(next));
}

/* =========================
   DAY ADVANCE (NEEDS-BASED)
========================= */
function advanceDayBecauseNeedsComplete() {
  // bump per-pet age
  const ages = loadPetAges();
  const currentPet = state.animalId;
  ages[currentPet] = (ages[currentPet] ?? 0) + 1;
  savePetAges(ages);

  // advance day + reset needs
  persist({
    ...state,
    daysPlayed: (state.daysPlayed ?? 0) + 1,
    needs: { ...defaultState.needs },
  });
}

/* =========================
   PUBLIC API
========================= */
export function loadGameState(): GameState {
  return state;
}

export function subscribeGameState(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

/* =========================
   MUTATORS
========================= */
export function setSelectedPet(animalId: AnimalId) {
  persist({ ...state, animalId });
}

export function setEquippedAccessory(accessory: AccessoryId, equipped: boolean) {
  if (equipped && (state.ownedAccessories[accessory] ?? 0) <= 0) return;

  persist({
    ...state,
    equippedAccessories: { ...state.equippedAccessories, [accessory]: equipped },
  });
}

export function addTransaction(tx: Omit<Transaction, "id" | "createdAt">) {
  const nextTx: Transaction = {
    id: uid(),
    createdAt: Date.now(),
    type: tx.type,
    amount: Math.max(0, Math.round(tx.amount)),
    category: tx.category,
    note: tx.note,
  };

  persist({
    ...state,
    transactions: [nextTx, ...state.transactions].slice(0, 250),
  });
}

export function applyMoneyDelta(delta: number, meta?: { category?: string; note?: string }) {
  const type: TxType = delta >= 0 ? "income" : "expense";
  const amount = Math.abs(Math.round(delta));

  const nextTx: Transaction = {
    id: uid(),
    createdAt: Date.now(),
    type,
    amount,
    category: meta?.category ?? (type === "income" ? "Game Earned" : "Game Spent"),
    note: meta?.note ?? (type === "income" ? "Earned on Map" : "Spent on Map"),
  };

  persist({
    ...state,
    money: Math.max(0, Math.round(state.money + delta)),
    transactions: [nextTx, ...state.transactions].slice(0, 250),
  });
}

/**
 * ✅ Needs setter:
 * - clamps values 0..100
 * - advances day ONLY when you CROSS from "not complete" -> "complete"
 */
export function setNeed(need: NeedId, value: number) {
  const prevComplete = allNeedsComplete(state.needs);

  const nextNeeds: Needs = clampNeeds({
    ...state.needs,
    [need]: value,
  });

  const nextComplete = allNeedsComplete(nextNeeds);

  // always store the updated needs
  persist({ ...state, needs: nextNeeds });

  // ✅ only advance if you CROSS the finish line
  if (!prevComplete && nextComplete) {
    advanceDayBecauseNeedsComplete();
  }
}

/**
 * ✅ Convenience helper for Map actions:
 * e.g., bumpNeed("hunger", +20)
 */
export function bumpNeed(need: NeedId, delta: number) {
  const current = state.needs?.[need] ?? 0;
  setNeed(need, current + delta);
}

/**
 * 🚫 IMPORTANT:
 * Days should NOT be time-based anymore.
 * Keep this exported so old code doesn't crash,
 * but it should NOT change daysPlayed.
 */
export function incrementDaysPlayed(_by: number = 1) {
  // no-op on purpose
}

export function addOwnedAccessory(accessory: AccessoryId, count: number = 1) {
  const add = Math.max(0, Math.floor(count || 0));
  if (add <= 0) return;

  persist({
    ...state,
    ownedAccessories: {
      ...state.ownedAccessories,
      [accessory]: Math.max(0, (state.ownedAccessories[accessory] ?? 0) + add),
    },
  });
}

export function purchasePremiumPet(petId: AnimalId, cost: number) {
  if (state.ownedPets[petId]) return;

  const price = Math.max(0, Math.round(cost));
  if (state.money < price) return;

  const nextTx: Transaction = {
    id: uid(),
    createdAt: Date.now(),
    type: "expense",
    amount: price,
    category: "Pet Purchase",
    note: `Purchased ${petId}`,
  };

  persist({
    ...state,
    money: Math.max(0, state.money - price),
    ownedPets: { ...state.ownedPets, [petId]: true },
    transactions: [nextTx, ...state.transactions].slice(0, 250),
  });
}
