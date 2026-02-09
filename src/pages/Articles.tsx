// src/pages/Articles.tsx

// React + hooks we use throughout the page:
// - useState: component state (money, needs, UI state, etc.)
// - useEffect: timers/subscriptions + side effects
// - useMemo: memoize computed objects/arrays (places, pulse, actionButtons, etc.)
// - useRef: store mutable values that don’t trigger re-renders (DOM refs, latest need values, etc.)
import React, { useEffect, useMemo, useRef, useState } from "react";

// Game store helpers/types used to persist and update game state across pages (money, selected pet, accessories, etc.)
import {
  AccessoryId,
  AnimalId,
  GameState,
  loadGameState,
  subscribeGameState,
  setSelectedPet,
  applyMoneyDelta,
  addOwnedAccessory,
  setEquippedAccessory,
  setNeed,
  bumpNeed,
} from "../components/store/gameStore";

// The set of “buildings”/locations that exist on the map
type Place = "restaurant" | "hospital" | "bathroom" | "salon" | "toystore";

// 30 minute cycle duration in milliseconds
const CYCLE_MS = 30 * 60 * 1000;

const PET_AGES_KEY = "petquest_pet_ages_v1";

type PetAges = Partial<Record<AnimalId, number>>;

function loadPetAges(): PetAges {
  try {
    const raw = localStorage.getItem(PET_AGES_KEY);
    return raw ? (JSON.parse(raw) as PetAges) : {};
  } catch {
    return {};
  }
}

function savePetAges(next: PetAges) {
  try {
    localStorage.setItem(PET_AGES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// Helper: clamp any number to 0..100 (used for need stats)
const clamp = (v: number) => Math.max(0, Math.min(100, v));



// Helper: format money as "$<rounded>"
const fmtMoney = (v: number) => `$${Math.round(v)}`;

// Font used across the inline CSS theme
const font = "Monument, sans-serif";

// Accessory catalog (IDs must match your store’s AccessoryId type)
// - cost: what it costs at Salon
// - earnBadgeCount: your store may use this for achievements/badges
const ACCESSORIES: Array<{
  id: AccessoryId;
  label: string;
  cost: number;
  earnBadgeCount: boolean;
}> = [
  { id: "collar", label: "Collar", cost: 12, earnBadgeCount: true },
  { id: "leash", label: "Leash", cost: 10, earnBadgeCount: true },
  { id: "headband", label: "Headband", cost: 15, earnBadgeCount: true },
];

// Floating sign above the pet (shows what you just did + resulting mood)
// - untilMs controls auto-hide
type PetSign = {
  needLabel: "Feed" | "Play" | "Rest" | "Clean" | "Health Check";
  moodLabel: "Happy" | "Sick" | "Sad" | "Energetic";
  untilMs: number;
};

export default function ArticlesPage() {
  // Building positions (in % relative to map container)
  // useMemo so the object is stable across renders (avoids unnecessary recalculations)
  const places = useMemo<Record<Place, { x: number; y: number }>>(
    () => ({
      restaurant: { x: 18, y: 22 },
      hospital: { x: 78, y: 22 },
      bathroom: { x: 22, y: 72 },
      salon: { x: 78, y: 72 },
      toystore: { x: 50, y: 50 },
    }),
    []
  );

  // Pet “skins”/options: maps AnimalId -> display name + emoji
  const animals: Record<AnimalId, { name: string; emoji: string }> = {
    pig: { name: "Pig", emoji: "🐷" },
    dog: { name: "Dog", emoji: "🐶" },
    cat: { name: "Cat", emoji: "🐱" },
    fox: { name: "Fox", emoji: "🦊" },
    bunny: { name: "Bunny", emoji: "🐰" },
    unicorn: { name: "Unicorn", emoji: "🦄" },
    snake: { name: "Snake", emoji: "🐍" },
    panda: { name: "Panda", emoji: "🐼" },
    dragon: { name: "Dragon", emoji: "🐉" },
  };

  /* =========================
     STORE-SYNCED GAME STATE
     - pulled from loadGameState() on first render
     - kept up-to-date via subscribeGameState()
  ========================= */

  // Current money (in-game currency)
  const [money, setMoney] = useState<number>(loadGameState().money);

  // Currently selected pet id
  const [animalId, setAnimalIdState] = useState<AnimalId>(loadGameState().animalId);

  // ✅ Per-pet age (days lived) stored locally
  const [petAges, setPetAges] = useState<PetAges>(() => loadPetAges());

  // Age for the currently selected pet
  const currentPetAge = petAges[animalId] ?? 0;


  // Owned accessories counts, e.g. { collar: 1, leash: 0, ... }
  const [ownedAcc, setOwnedAcc] = useState<GameState["ownedAccessories"]>(
    loadGameState().ownedAccessories
  );

  // Which accessories are currently equipped, e.g. { collar: true, leash: false, ... }
  const [equipped, setEquipped] = useState<GameState["equippedAccessories"]>(
    loadGameState().equippedAccessories
  );

  /* =========================
     NEEDS (local state)
     These are "virtual pet" stats that decay over time and are boosted by actions.
  ========================= */
  const [hunger, setHunger] = useState<number>(70);
  const [fun, setFun] = useState<number>(70);
  const [health, setHealth] = useState<number>(75);
  const [bathroom, setBathroom] = useState<number>(70);

  // Refs that always hold the latest need values
  // This avoids stale closures when we compute mood in async timeouts.
  const hungerRef = useRef(hunger);
  const funRef = useRef(fun);
  const healthRef = useRef(health);
  const bathroomRef = useRef(bathroom);

  // Keep the refs synced whenever state changes
  useEffect(() => {
    hungerRef.current = hunger;
  }, [hunger]);
  useEffect(() => {
    funRef.current = fun;
  }, [fun]);
  useEffect(() => {
    healthRef.current = health;
  }, [health]);
  useEffect(() => {
    bathroomRef.current = bathroom;
  }, [bathroom]);

  /* =========================
     UI STATE
  ========================= */

  // Status line at top right of map
  const [status, setStatus] = useState<string>("Tip: click a place");

  // Toast message at bottom (auto hides)
  const [toast, setToast] = useState<string | null>(null);

  // Which building is currently selected / active (controls action buttons)
  const [active, setActive] = useState<Place | null>(null);

  // Floating sign above the pet after an action completes
  const [petSign, setPetSign] = useState<PetSign | null>(null);

  // Map a place -> the “need label” we display in the floating sign
  function needLabelForPlace(p: Place): PetSign["needLabel"] {
    if (p === "restaurant") return "Feed";
    if (p === "toystore") return "Play";
    if (p === "bathroom") return "Clean";
    if (p === "hospital") return "Health Check";
    // salon
    return "Rest";
  }

  // Compute mood from needs (simple heuristic)
  // - Sick if health is low (priority)
  // - Otherwise based on average needs
  function moodFromNeeds(h: number, f: number, he: number, b: number): PetSign["moodLabel"] {
    // priority: sick if health is low
    if (he < 50) return "Sick";

    const avg = (h + f + he + b) / 4;

    if (avg >= 82) return "Happy";
    if (avg < 55) return "Sad";
    return "Energetic";
  }

  // ✅ LIVE mood (updates automatically as needs change)
  const currentMood = useMemo(() => {
    return moodFromNeeds(hunger, fun, health, bathroom);
  }, [hunger, fun, health, bathroom]);

  const moodEmoji: Record<PetSign["moodLabel"], string> = {
    Happy: "😊",
    Energetic: "⚡",
    Sad: "😢",
    Sick: "🤒",
  };


  // Show floating sign above the pet after using a place
  // Uses refs to ensure we read the latest values after state updates
  function showPetSign(placeUsed: Place) {
    // wait a tick to ensure state setters already applied
    window.setTimeout(() => {
      const h = hungerRef.current;
      const f = funRef.current;
      const he = healthRef.current;
      const b = bathroomRef.current;

      // Build the sign data
      const next: PetSign = {
        needLabel: needLabelForPlace(placeUsed),
        moodLabel: moodFromNeeds(h, f, he, b),
        untilMs: Date.now() + 2200,
      };
      setPetSign(next);

      // auto-hide after ~2.3s (slightly longer than untilMs)
      window.setTimeout(() => {
        setPetSign((prev) => {
          if (!prev) return null;
          if (Date.now() >= prev.untilMs) return null;
          return prev;
        });
      }, 2300);
    }, 0);
  }

  /* =========================
     PLAYER MOVEMENT + CYCLE TIMERS
  ========================= */

  // Player position in % coordinates
  const [player, setPlayer] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Cycle timing
  const [cycleStartMs, setCycleStartMs] = useState<number>(Date.now()); // when the 30-min cycle started
  const [nowTick, setNowTick] = useState<number>(Date.now()); // updated every second for countdown display

  // Current “in-progress” action (one at a time)
  // - label: what user chose
  // - startedAt/durationMs: for progress UI + completion
  // - onFinish: callback that actually applies effects
  const [action, setAction] = useState<{
    label: string;
    startedAt: number;
    durationMs: number;
    onFinish: () => void;
  } | null>(null);

  // Ref to the map wrapper DOM node (used to inject/remove trail dots)
  const mapWrapRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     STORE SUBSCRIPTION
     Keeps this page synced to the shared gameStore.
  ========================= */
  useEffect(() => {
    // Initial load
    const s = loadGameState();
    setMoney(s.money);
    setAnimalIdState(s.animalId);
    setOwnedAcc(s.ownedAccessories);
    setEquipped(s.equippedAccessories);

    // Subscribe to store updates (cleanup returned from subscribeGameState)
    return subscribeGameState((next: GameState) => {
      setMoney(next.money);
      setAnimalIdState(next.animalId);
      setOwnedAcc(next.ownedAccessories);
      setEquipped(next.equippedAccessories);
    });
  }, []);

  useEffect(() => {
    savePetAges(petAges);
  }, [petAges]);

    // ✅ STEP 3: bridge local map stats -> gameStore needs
    // (so "one day" can be based on store needs reaching 100)
    function bumpStoreNeeds(partial: {
      hunger?: number;
      fun?: number;
      health?: number;
      bathroom?: number;
    }) {
      if (partial.hunger != null) bumpNeed("hunger", partial.hunger);
      if (partial.fun != null) bumpNeed("fun", partial.fun);
      if (partial.health != null) bumpNeed("health", partial.health);

      // map bathroom -> store sleep (or thirst if you prefer)
      if (partial.bathroom != null) bumpNeed("sleep", partial.bathroom);
    }


  // Show a temporary toast at bottom of map
  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1700);
  }

  // Draw a little “trail dot” where the pet was (visual movement feedback)
  function dropTrailDot(fromX: number, fromY: number) {
    const wrap = mapWrapRef.current;
    if (!wrap) return;

    const t = document.createElement("div");
    t.className = "trail";
    t.style.left = fromX + "%";
    t.style.top = fromY + "%";
    wrap.appendChild(t);

    // Remove after animation finishes
    setTimeout(() => t.remove(), 700);
  }

  // Move player to a given place (updates position + leaves a trail dot)
  function movePlayerTo(place: Place) {
    const pos = places[place];
    dropTrailDot(player.x, player.y);
    setPlayer({ x: pos.x, y: pos.y });
  }

  // Determine which buildings should “pulse” to attract attention
  // (based on low needs or enough money for salon)
  const pulse = useMemo(() => {
    return {
      restaurant: hunger < 55,
      hospital: health < 60,
      bathroom: bathroom < 55,
      toystore: fun < 55,
      salon: money >= 10,
    };
  }, [hunger, health, bathroom, fun, money]);

  // Update nowTick every second (for cycle countdown label)
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // 30-min cycle effect:
  // - needs decay
  // - reward money
  // - increment “days played”
  // This runs continuously and triggers when elapsed >= CYCLE_MS.
  useEffect(() => {
    function applyCycle() {
      // Decay needs
      setHunger((v) => clamp(v - 18));
      setFun((v) => clamp(v - 16));
      setHealth((v) => clamp(v - 14));
      setBathroom((v) => clamp(v - 12));

      // Reward: add money and log it
      applyMoneyDelta(100, { category: "Cycle Reward", note: "30-minute reward" });



      // User feedback
      showToast("⏳ 30 minutes passed — needs dropped, +$100 earned!");
      setStatus("Cycle complete: needs dropped + $100 earned");

      // Reset cycle timer start
      setCycleStartMs(Date.now());
    }

    // If user returns after time passed, trigger immediately
    const elapsed = Date.now() - cycleStartMs;
    if (elapsed >= CYCLE_MS) applyCycle();

    // Otherwise check every second
    const interval = window.setInterval(() => {
      if (Date.now() - cycleStartMs >= CYCLE_MS) applyCycle();
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleStartMs, animalId]);

  // Countdown milliseconds remaining in the current cycle
  const msLeft = Math.max(0, CYCLE_MS - (nowTick - cycleStartMs));

  // Action timer: when an action is active, poll and finish when time is up
  useEffect(() => {
    if (!action) return;

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - action.startedAt;
      if (elapsed >= action.durationMs) {
        window.clearInterval(tick);

        // Capture callback, clear action first (updates UI), then run effects
        const finish = action.onFinish;
        setAction(null);
        finish();
      }
    }, 80);

    return () => window.clearInterval(tick);
  }, [action]);

  // Start an action (one at a time)
  function startAction(label: string, durationMs: number, onFinish: () => void) {
    if (action) return; // prevent double actions
    setAction({ label, durationMs, startedAt: Date.now(), onFinish });
  }

  // Visit a place: set active building, move player, and update status
  function visit(place: Place) {
    setActive(place);
    movePlayerTo(place);
    setStatus(`Arrived at ${place}`);
  }

  // Build the set of action buttons based on the active place
  // Each button defines:
  // - label: text shown
  // - durationMs: time to “complete”
  // - run(): effects applied on completion
  const actionButtons = useMemo(() => {
    if (!active) return [];

    // Restaurant actions (free, increases hunger, earns money)
    if (active === "restaurant") {
      return [
        {
          label: "Eat meal (FREE) — longer",
          durationMs: 8000,
          run: () => {
            bumpNeed("hunger", 38);
            setHunger((v) => clamp(v + 38));
            applyMoneyDelta(25, { category: "Restaurant", note: "Meal completed" });
            showToast("🍖 Meal done (+hunger, +$25)");
            setStatus("Restaurant complete: hunger up + money earned");
            showPetSign("restaurant");
          },
        },
        {
          label: "Treat snack (FREE) — quick",
          durationMs: 3200,
          run: () => {
            setHunger((v) => clamp(v + 22));
            applyMoneyDelta(12, { category: "Restaurant", note: "Snack completed" });
            showToast("🍪 Snack done (+hunger, +$12)");
            setStatus("Restaurant quick: hunger up + money earned");
            showPetSign("restaurant");
          },
        },
      ];
    }

    // Hospital actions (free, increases health, earns money)
    if (active === "hospital") {
      return [
        {
          label: "Doctor checkup (FREE) — longer",
          durationMs: 9000,
          run: () => {
            bumpNeed("health", 40);
            setHealth((v) => clamp(v + 40));
            applyMoneyDelta(30, { category: "Hospital", note: "Doctor checkup" });
            showToast("🏥 Checkup done (+health, +$30)");
            setStatus("Hospital complete: health up + money earned");
            showPetSign("hospital");
          },
        },
        {
          label: "Quick wellness scan (FREE) — quick",
          durationMs: 3800,
          run: () => {
            setHealth((v) => clamp(v + 22));
            applyMoneyDelta(15, { category: "Hospital", note: "Wellness scan" });
            showToast("🩺 Scan done (+health, +$15)");
            setStatus("Hospital quick: health up + money earned");
            showPetSign("hospital");
          },
        },
      ];
    }

    // Bathroom actions (free, increases bathroom stat, earns money)
    if (active === "bathroom") {
      return [
        {
          label: "Full bathroom break (FREE) — longer",
          durationMs: 6000,
          run: () => {
            bumpNeed("sleep", 45);
            setBathroom((v) => clamp(v + 45));
            applyMoneyDelta(10, { category: "Bathroom", note: "Full bathroom break" });
            showToast("🚻 Done (+bathroom, +$10)");
            setStatus("Bathroom complete: bathroom up + money earned");
            showPetSign("bathroom");
          },
        },
        {
          label: "Quick bathroom break (FREE) — quick",
          durationMs: 2400,
          run: () => {
            setBathroom((v) => clamp(v + 25));
            applyMoneyDelta(5, { category: "Bathroom", note: "Quick bathroom break" });
            showToast("🚻 Quick (+bathroom, +$5)");
            setStatus("Bathroom quick: bathroom up + money earned");
            showPetSign("bathroom");
          },
        },
      ];
    }

    // Toy store actions (cost money, increases fun)
    if (active === "toystore") {
      return [
        {
          label: "Buy toy ($20) — longer play",
          durationMs: 5200,
          run: () => {
            if (money < 20) return showToast("Need $20 for Toy Store");
            applyMoneyDelta(-20, { category: "Toy Store", note: "Toy purchased" });
            bumpNeed("fun", 42);
            setFun((v) => clamp(v + 42));
            showToast("🧸 Toy bought (+fun)");
            setStatus("Toy Store: fun up (paid)");
            showPetSign("toystore");
          },
        },
        {
          label: "Buy small toy ($10) — quick",
          durationMs: 2500,
          run: () => {
            if (money < 10) return showToast("Need $10 for Toy Store");
            applyMoneyDelta(-10, { category: "Toy Store", note: "Small toy purchased" });
            setFun((v) => clamp(v + 24));
            showToast("🎾 Small toy (+fun)");
            setStatus("Toy Store: fun up (paid)");
            showPetSign("toystore");
          },
        },
      ];
    }

    // Salon actions (spending) — purchase accessories and grooming
    return [
      {
        label: "Buy collar ($12)",
        durationMs: 3000,
        run: () => {
          if (money < 12) return showToast("Need $12 for Salon");
          applyMoneyDelta(-12, { category: "Salon", note: "Bought collar" });
          addOwnedAccessory("collar", 1);
          showToast("🎀 Collar bought!");
          setStatus("Salon: accessory bought (paid)");
          showPetSign("salon");
        },
      },
      {
        label: "Buy leash ($10)",
        durationMs: 2800,
        run: () => {
          if (money < 10) return showToast("Need $10 for Salon");
          applyMoneyDelta(-10, { category: "Salon", note: "Bought leash" });
          addOwnedAccessory("leash", 1);
          showToast("🪢 Leash bought!");
          setStatus("Salon: accessory bought (paid)");
          showPetSign("salon");
        },
      },
      {
        label: "Buy headband ($15)",
        durationMs: 2800,
        run: () => {
          if (money < 15) return showToast("Need $15 for Salon");
          applyMoneyDelta(-15, { category: "Salon", note: "Bought headband" });
          addOwnedAccessory("headband", 1);
          showToast("👑 Headband bought!");
          setStatus("Salon: accessory bought (paid)");
          showPetSign("salon");
        },
      },
      {
        label: "Grooming ($18) — longer",
        durationMs: 6500,
        run: () => {
          if (money < 18) return showToast("Need $18 for Salon");
          applyMoneyDelta(-18, { category: "Salon", note: "Grooming" });
          showToast("✨ Groomed!");
          setStatus("Salon: grooming done (paid)");
          showPetSign("salon");
        },
      },
    ];
  }, [active, money]);

  // Action progress calculations for the progress bar
  const actionElapsed = action ? Date.now() - action.startedAt : 0;
  const actionRemaining = action ? Math.max(0, action.durationMs - actionElapsed) : 0;
  const actionPct = action
    ? Math.min(100, Math.max(0, (actionElapsed / action.durationMs) * 100))
    : 0;

  // Change selected pet (both local state + persisted store state)
  const onPickAnimal = (id: AnimalId) => {
    setAnimalIdState(id);
    setSelectedPet(id);

    // ✅ Ensure selected pet has its own age entry
    setPetAges((prev) => {
      if (prev[id] != null) return prev;
      return { ...prev, [id]: 0 };
    });
  };

  // Equip/unequip an accessory
  // - prevents equipping if you don’t own it
  // - updates local UI state + store persistence
  const onToggleEquip = (a: AccessoryId, value: boolean) => {
    const ownedCount = (ownedAcc as Partial<Record<AccessoryId, number>>)[a] ?? 0;
    if (ownedCount <= 0 && value) return;

    setEquipped((prev) => ({ ...prev, [a]: value }));
    setEquippedAccessory(a, value);
  };

  return (
    <div className="pc-app">
      {/* Inject the big CSS string as page-level styles */}
      <style>{styles}</style>

      {/* =========================
          LEFT PANEL (controls + stats)
      ========================= */}
      <div className="pc-panel">
        <div className="pc-titleRow">
          <h1 className="pc-h1">Pet City Map</h1>
          <span className="pc-pill">PETQuest</span>
        </div>

        {/* Pet picker */}
        <div className="pc-block">
          <div className="pc-label">Choose animal</div>
          <div className="pc-chips">
            {Object.entries(animals).map(([id, info]) => (
              <button
                key={id}
                className={animalId === (id as AnimalId) ? "pc-chip pc-chipActive" : "pc-chip"}
                onClick={() => onPickAnimal(id as AnimalId)}
                disabled={!!action} // lock changing pet while an action is running
                title={action ? "Finish current action first" : ""}
                style={{ color: "#fff" }}
              >
                {info.emoji} {info.name}
              </button>
            ))}
          </div>
        </div>

        {/* Accessories / equip toggles */}
        <div className="pc-block">
          <div className="pc-sectionTitle">Accessories (equip)</div>
          <div className="pc-muted" style={{ marginBottom: 8 }}>
            Buy accessories at the Salon, then equip them here.
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {ACCESSORIES.map((a) => {
              const ownedCount = (ownedAcc as Partial<Record<AccessoryId, number>>)[a.id] ?? 0;
              return (
                <div key={a.id} className="pc-accRow">
                  <div>
                    <div className="pc-strong" style={{ fontSize: 13 }}>
                      {a.label}
                    </div>
                    <div className="pc-muted">Owned: {ownedCount}</div>
                  </div>

                  {/* Toggle switch */}
                  <label className="pc-switchWrap">
                    <input
                      type="checkbox"
                      checked={!!equipped[a.id]}
                      disabled={ownedCount <= 0} // can’t equip if not owned
                      onChange={(e) => onToggleEquip(a.id, e.target.checked)}
                    />
                    <span className="pc-switch" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Need bars */}
        <div className="pc-stats">
          <StatPanel label="Hunger" value={`${hunger} / 100`} pct={hunger} danger={hunger < 50} good={hunger >= 80} />
          <StatPanel label="Fun" value={`${fun} / 100`} pct={fun} danger={fun < 50} good={fun >= 80} />
          <StatPanel
            label="Health"
            value={`${health} / 100`}
            pct={health}
            danger={health < 55}
            good={health >= 80}
          />
          <StatPanel
            label="Bathroom"
            value={`${bathroom} / 100`}
            pct={bathroom}
            danger={bathroom < 50}
            good={bathroom >= 80}
          />
        </div>

        {/* Hint about free/paid buildings */}
        <div className="pc-hint">
          Click a building to travel. Restaurant/Hospital/Bathroom are FREE and EARN money. Toy Store + Salon cost money.
        </div>

        {/* Active location info */}
        <div className="pc-block">
          <div className="pc-sectionTitle">Current location</div>
          <div className="pc-muted">{active ? active : "None yet — click a building"}</div>
        </div>

        {/* Actions for the current location */}
        {active && (
          <div className="pc-block">
            <div className="pc-sectionTitle">Actions</div>

            {/* Action progress UI */}
            {action && (
              <div className="pc-actionCard">
                <div className="pc-strong">{action.label}</div>
                <div className="pc-progressOuter">
                  <div className="pc-progressInner" style={{ width: `${actionPct}%` }} />
                </div>
                <div className="pc-muted">Time left: {Math.ceil(actionRemaining / 1000)}s</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pc-actions">
              {actionButtons.map((a) => (
                <button
                  key={a.label}
                  className="pc-actionBtn"
                  disabled={!!action} // only one action at a time
                  onClick={() => startAction(a.label, a.durationMs, a.run)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* “Back Home” control */}
        <div className="pc-controls">
          <button className="pc-reset" onClick={() => (window.location.href = "/")}>
            Back Home
          </button>
        </div>
      </div>

      {/* =========================
          MAP AREA (right side)
      ========================= */}
      <div className="mapWrap" id="mapWrap" ref={mapWrapRef}>
        {/* Top HUD with money + status */}
        <div className="topHUD">
          <div className="money">
            <span className="dot"></span>
            <span>{fmtMoney(money)}</span>
          </div>
          {/* ✅ Mood pill (live) */}
          <div className={`moodPill mood-${currentMood.toLowerCase()}`}>
            <span className="moodEmoji">{moodEmoji[currentMood]}</span>
            <span className="moodText">{currentMood}</span>
          </div>

          <div className="agePill">
            <span className="ageText">{currentPetAge} days</span>
          </div>
          <div className="statusPill">{status}</div>
        </div>

        {/* Countdown to next cycle reward */}
        <div className="cyclePill">Next cycle reward in: {Math.ceil(msLeft / 1000)}s</div>

        {/* Background “tiles” grid (purely decorative) */}
        <div className="map" aria-hidden="true">
          <div className="tile grass" style={{ gridColumn: "1 / span 3", gridRow: "1 / span 3" }} />
          <div className="tile road" style={{ gridColumn: "4 / span 6", gridRow: "2 / span 2" }} />
          <div className="tile grass" style={{ gridColumn: "10 / span 3", gridRow: "1 / span 3" }} />
          <div className="tile road" style={{ gridColumn: "2 / span 10", gridRow: "5 / span 2" }} />
          <div className="tile grass" style={{ gridColumn: "1 / span 4", gridRow: "8 / span 3" }} />
          <div className="tile grass" style={{ gridColumn: "9 / span 4", gridRow: "8 / span 3" }} />
          <div className="tile" style={{ gridColumn: "5 / span 4", gridRow: "8 / span 2" }} />
          <div className="tile" style={{ gridColumn: "5 / span 4", gridRow: "1 / span 2" }} />
        </div>

        {/* Clickable buildings */}
        <Building
          id="restaurant"
          title="🍽️ Restaurant"
          subtitle="Feeds pet • +money"
          icon="🍔"
          active={active === "restaurant"}
          pulse={pulse.restaurant}
          onClick={() => visit("restaurant")}
        />
        <Building
          id="hospital"
          title="🏥 Vet"
          subtitle="Heals pet • +money"
          icon="➕"
          active={active === "hospital"}
          pulse={pulse.hospital}
          onClick={() => visit("hospital")}
        />
        <Building
          id="bathroom"
          title="🚻 Bathroom"
          subtitle="Bathroom • +money"
          icon="🧼"
          active={active === "bathroom"}
          pulse={pulse.bathroom}
          onClick={() => visit("bathroom")}
        />
        <Building
          id="salon"
          title="💇‍♀️ Salon"
          subtitle="Accessories • -money"
          icon="🎀"
          active={active === "salon"}
          pulse={pulse.salon}
          onClick={() => visit("salon")}
        />
        <Building
          id="toystore"
          title="🧸 Toy Store"
          subtitle="Toys • -money"
          icon="🪀"
          active={active === "toystore"}
          pulse={pulse.toystore}
          onClick={() => visit("toystore")}
        />

        {/* Pet sprite (emoji) with equipped accessory overlays */}
        <div className="player" style={{ left: `${player.x}%`, top: `${player.y}%` }} aria-label="player">
          {/* Floating sign above pet after actions */}
          {petSign && Date.now() < petSign.untilMs && (
            <div className="petSign" aria-label="pet-sign">
              <div className="petSignTop">{petSign.needLabel}</div>
              <div className="petSignBot">{petSign.moodLabel}</div>
            </div>
          )}

          {/* Main pet emoji */}
          <span className="petEmoji">{animals[animalId].emoji}</span>

          {/* Accessory visual layers */}
          {equipped.headband && <span className="acc headband" />}
          {equipped.collar && <span className="acc collar" />}
          {equipped.leash && <span className="acc leash" />}
        </div>

        {/* Toast message */}
        <div className={toast ? "toast show" : "toast"}>{toast ?? ""}</div>
      </div>
    </div>
  );
}

/* =========================
   STAT PANEL (left side bars)
   Renders label/value + a progress bar with different color states.
========================= */
function StatPanel({
  label,
  value,
  pct,
  danger,
  good,
}: {
  label: string;
  value: string;
  pct: number;
  danger?: boolean;
  good?: boolean;
}) {
  // Choose bar fill style based on state
  const cls = good ? "pc-fill pc-good" : danger ? "pc-fill pc-danger" : "pc-fill";
  return (
    <div className="pc-stat">
      <div className="pc-row">
        <span className="pc-statLabel">{label}</span>
        <span className="pc-statValue">{value}</span>
      </div>
      <div className="pc-bar">
        <div className={cls} style={{ width: `${clamp(pct)}%` }} />
      </div>
    </div>
  );
}

/* =========================
   BUILDING COMPONENT
   A single clickable building card on the map.
========================= */
function Building({
  id,
  title,
  subtitle,
  icon,
  active,
  pulse,
  onClick,
}: {
  id: Place;
  title: string;
  subtitle: string;
  icon: string;
  active: boolean;
  pulse: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`building ${id} ${active ? "active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="b-head">
        <div>
          <p className="b-name">{title}</p>
          <p className="b-sub">{subtitle}</p>
        </div>

        {/* Icon box (can pulse to highlight urgency) */}
        <div className={`icon ${pulse ? "pulse" : ""}`}>{icon}</div>
      </div>
    </div>
  );
}

/**
 * ✅ AUTUMN THEME:
 * - swaps the old blue/cyan accents to gold/orange/rust
 * - keeps everything else working the same
 *
 * This is a raw CSS string injected via <style>{styles}</style>
 * so the whole page can be self-contained without an external CSS file.
 */
const styles = `
*{box-sizing:border-box}
body{
  margin:0;
  background:#000;
  color:#fff;
  font-family:${font};
}
button{font-family:${font};}

:root{
  --bg:#000000;
  --panel: rgba(22,14,20,0.92);
  --panelBorder: rgba(255,182,213,0.22);
  --surface: rgba(255,182,213,0.10);
  --muted: rgba(255,210,235,0.78);

  /* 💗 PINK THEME */
  --accent1: #FF7EB6;   /* primary pink */
  --accent2: #FF4F9A;   /* hot pink */
  --accent3: #E83E8C;   /* deep pink */
  --accent4: #B83280;   /* dark rose */

  --glow1: rgba(255,126,182,0.65);
  --glow2: rgba(255,79,154,0.45);
}

/* layout */
.pc-app{
  width:min(1100px, 100%);
  display:grid;
  grid-template-columns: 340px 1fr;
  gap:16px;
  margin: 20px auto;
  padding: 8px 12px;
}

/* LEFT PANEL */
.pc-panel{
  background: var(--panel);
  border:1px solid var(--panelBorder);
  border-radius:18px;
  padding:16px;
  box-shadow: 0 18px 44px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05);
  color: #fff;
  backdrop-filter: blur(14px);
}
.pc-titleRow{display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px;}
.pc-h1{font-size:16px; margin:0; letter-spacing:0.3px;}
.pc-pill{
  font-size:12px; padding:6px 10px;
  border:1px solid rgba(217,122,43,0.35);
  border-radius:999px;
  background: linear-gradient(135deg, rgba(232,211,106,0.18), rgba(217,122,43,0.12));
  color: rgba(255,255,255,0.92);
}

.pc-block{margin-top:12px;}
.pc-label{font-size:12px; margin-bottom:6px; color: rgba(255,255,255,0.85);}
.pc-muted{font-size:12px; color: var(--muted);}
.pc-sectionTitle{font-weight:900; margin-bottom:6px;}
.pc-strong{font-weight:900;}

.pc-chips{display:flex; flex-wrap:wrap; gap:8px;}
.pc-chip{
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  border-radius:14px;
  padding:8px 10px;
  cursor:pointer;
  font-weight:800;
  font-size:13px;
  transition: transform .16s ease, background .16s ease, box-shadow .16s ease, border-color .16s ease;
}
.pc-chip:hover{
  background: rgba(255,255,255,0.10);
  transform: translateY(-1px);
  border-color: rgba(232,211,106,0.28);
}
.pc-chipActive{
  outline:2px solid rgba(232,211,106,0.75);
  background: linear-gradient(135deg, rgba(232,211,106,0.14), rgba(217,122,43,0.10));
}
.pc-chip:disabled{opacity:0.55; cursor:not-allowed; transform:none;}

.pc-accRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border:1px solid rgba(255,255,255,0.12);
  border-radius:14px;
  padding:10px 12px;
  background: rgba(255,255,255,0.05);
}
.pc-switchWrap{display:flex; align-items:center; gap:8px; cursor:pointer;}
.pc-switchWrap input{display:none}
.pc-switch{
  width:46px; height:26px; border-radius:999px;
  background: rgba(255,255,255,0.10);
  position:relative;
  border:1px solid rgba(255,255,255,0.16);
}
.pc-switch::after{
  content:"";
  width:20px; height:20px; border-radius:999px;
  background: rgba(255,255,255,0.85);
  position:absolute; top:2px; left:2px;
  transition: all .15s ease;
}
.pc-switchWrap input:checked + .pc-switch{
  background: linear-gradient(135deg, rgba(232,211,106,0.22), rgba(217,122,43,0.18));
  border-color: rgba(232,211,106,0.45);
}
.pc-switchWrap input:checked + .pc-switch::after{left:24px; background:#fff;}

.pc-stats{display:grid; gap:10px; margin-top:12px;}
.pc-stat{
  background: rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:14px;
  padding:10px 12px;
}
.pc-row{display:flex; align-items:center; justify-content:space-between}
.pc-statLabel{font-size:12px; color: rgba(255,255,255,0.80);}
.pc-statValue{font-size:12px; font-weight:900; color:#fff;}
.pc-bar{
  height:10px; border-radius:999px;
  background: rgba(255,255,255,0.10);
  overflow:hidden; margin-top:8px;
}
.pc-fill{
  height:100%;
  border-radius:999px;
  background: linear-gradient(90deg, var(--accent1), var(--accent2));
}
.pc-good{
  background: linear-gradient(90deg, rgba(232,211,106,0.96), rgba(217,122,43,0.96));
}
.pc-danger{
  background: linear-gradient(90deg, var(--accent2), var(--accent3));
}

.pc-hint{margin-top:12px; font-size:12px; line-height:1.35; color: rgba(255,255,255,0.80);}

.pc-actions{display:grid; gap:8px; margin-top:10px;}
.pc-actionBtn{
  text-align:left;
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  border-radius:14px;
  padding:10px 12px;
  cursor:pointer;
  font-weight:900;
  font-size:13px;
  transition: transform .16s ease, background .16s ease, border-color .16s ease, box-shadow .16s ease;
}
.pc-actionBtn:hover{
  background: linear-gradient(135deg, rgba(232,211,106,0.14), rgba(217,122,43,0.10));
  border-color: rgba(232,211,106,0.28);
  transform: translateY(-1px);
}
.pc-actionBtn:disabled{opacity:0.55; cursor:not-allowed; transform:none;}

.pc-actionCard{
  margin-top: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.06);
}
.pc-progressOuter{
  height: 10px; border-radius: 999px;
  background: rgba(255,255,255,0.10);
  overflow: hidden; margin: 8px 0;
}
.pc-progressInner{
  height: 100%;
  background: linear-gradient(90deg, rgba(232,211,106,0.90), rgba(217,122,43,0.92));
  transition: width .10s linear;
}

.pc-controls{margin-top:14px;}
.pc-reset{
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  border-radius:14px;
  padding:10px 12px;
  cursor:pointer;
  font-weight:900;
  font-size:13px;
  color:#fff;
  transition: transform .16s ease, background .16s ease, border-color .16s ease;
}
.pc-reset:hover{
  background: linear-gradient(135deg, rgba(232,211,106,0.14), rgba(217,122,43,0.10));
  border-color: rgba(232,211,106,0.28);
  transform: translateY(-1px);
}

/* MAP */
.mapWrap{
  position:relative; overflow:hidden; border-radius:18px;
  border:1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(1200px 700px at 20% 10%, rgba(255,126,182,0.25) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,1) 100%),
    radial-gradient(900px 520px at 95% 20%, rgba(255,79,154,0.18) 0%, transparent 60%),
    radial-gradient(900px 520px at 30% 120%, rgba(232,62,140,0.14) 0%, transparent 60%),
    #000;
  box-shadow: 0 20px 50px rgba(0,0,0,0.70);
  min-height: 620px;
  color: #fff;
}

.topHUD{
  position:absolute; top:12px; left:12px; right:12px;
  display:flex; align-items:center; justify-content:space-between;
  pointer-events:none; z-index:50;
}
.money{
  pointer-events:none;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.14);
  border-radius:999px;
  padding:8px 12px;
  display:flex; align-items:center; gap:10px;
  font-weight:900;
}
.money .dot{
  width:10px; height:10px; border-radius:999px;
  background: var(--accent2);
  box-shadow: 0 0 18px var(--glow2);
}
.statusPill{
  pointer-events:none;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.14);
  border-radius:999px;
  padding:8px 12px;
  color: var(--muted);
  font-size:12px;
}

.moodPill{
  pointer-events:none;
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 12px;
  border-radius:999px;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.90);
  font-size:12px;
  font-weight:900;
}

.agePill{
  pointer-events:none;
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 12px;
  border-radius:999px;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.90);
  font-size:12px;
  font-weight:900;
}
.ageEmoji{font-size:14px;}


.moodEmoji{font-size:14px;}

/* Optional: mood-based accent */
.mood-happy{ border-color: rgba(232,211,106,0.45); box-shadow: 0 0 18px rgba(232,211,106,0.10); }
.mood-energetic{ border-color: rgba(217,122,43,0.45); box-shadow: 0 0 18px rgba(217,122,43,0.10); }
.mood-sad{ border-color: rgba(255,255,255,0.18); opacity: 0.92; }
.mood-sick{ border-color: rgba(178,74,42,0.55); box-shadow: 0 0 18px rgba(178,74,42,0.10); }

.cyclePill{
  position:absolute;
  top:56px; left:12px;
  padding:8px 12px;
  border-radius:999px;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.14);
  color: var(--muted);
  font-size:12px;
  z-index:50;
}

.map{
  position:absolute; inset:0;
  padding:18px;
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap:10px;
}
.tile{border-radius:14px; background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);}
.grass{background: linear-gradient(180deg, rgba(232,211,106,0.05), rgba(255,255,255,0.02));}
.road{background: linear-gradient(180deg, rgba(217,122,43,0.06), rgba(255,255,255,0.03));}

/* Buildings */
.building{
  position:absolute;
  width: 220px;
  border-radius: 18px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  padding: 12px 14px;
  cursor: pointer;
  user-select:none;
  transition: transform .16s ease, background .16s ease, box-shadow .16s ease, border-color .16s ease;
}
.building:hover{
  transform: translateY(-2px);
  background: rgba(255,255,255,0.08);
  box-shadow: 0 18px 40px rgba(0,0,0,0.55);
  border-color: rgba(232,211,106,0.26);
}
.building.active{outline: 2px solid rgba(232,211,106,0.65);}

.b-head{display:flex; align-items:flex-start; justify-content:space-between; gap:12px;}
.b-name{margin:0; font-weight:900;}
.b-sub{margin:4px 0 0 0; font-size:12px; color: rgba(255,255,255,0.70);}

.icon{
  width:42px; height:42px;
  border-radius:14px;
  display:grid; place-items:center;
  background: linear-gradient(135deg, rgba(255,126,182,0.28), rgba(255,79,154,0.18));
  border:1px solid rgba(255,255,255,0.12);
}
.icon.pulse{
  box-shadow:
    0 0 0 10px rgba(255,79,154,0.18),
    0 0 34px rgba(255,126,182,0.45);
}


/* building placement */
.building.restaurant{left: 6%; top: 14%;}
.building.hospital{left: 62%; top: 14%;}
.building.bathroom{left: 8%; top: 66%;}
.building.salon{left: 62%; top: 66%;}
.building.toystore{left: 37%; top: 40%;}

/* Player */
.player{
  position:absolute;
  transform: translate(-50%, -50%);
  width: 76px; height: 76px;
  border-radius: 999px;
  display:grid; place-items:center;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.14);
  box-shadow: 0 20px 40px rgba(0,0,0,0.55);
  z-index: 40;
}
.petEmoji{font-size: 34px; transform: translateY(2px);}

/* Pet Sign */
.petSign{
  position:absolute;
  left:50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  min-width: 120px;
  max-width: 190px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(0,0,0,0.70);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: 0 18px 44px rgba(0,0,0,0.60);
  backdrop-filter: blur(10px);
  text-align:center;
  animation: popUp .18s ease-out;
  pointer-events:none;
}
.petSign::after{
  content:"";
  position:absolute;
  left:50%;
  top: 100%;
  transform: translateX(-50%);
  width:0; height:0;
  border-left:8px solid transparent;
  border-right:8px solid transparent;
  border-top:10px solid rgba(0,0,0,0.70);
  filter: drop-shadow(0 -1px 0 rgba(255,255,255,0.12));
}
.petSignTop{
  font-weight: 950;
  font-size: 12px;
  color: rgba(255,255,255,0.95);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.petSignBot{
  margin-top: 2px;
  font-weight: 900;
  font-size: 12px;
  color: var(--accent1);
}

@keyframes popUp{
  from { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.98); }
  to { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); }
}

.acc{position:absolute; display:block;}
.acc.headband{
  top: 10px;
  width: 46px; height: 10px;
  border-radius: 999px;
  background: rgba(255,126,182,0.85);
}
.acc.collar{
  bottom: 14px;
  width: 46px; height: 10px;
  border-radius: 999px;
  background: rgba(255,79,154,0.80);
}
.acc.leash{
  right: 10px; bottom: 10px;
  width: 10px; height: 32px;
  border-radius: 999px;
  background: rgba(232,62,140,0.75);
}

.trail{
  position:absolute;
  width:10px; height:10px;
  border-radius:999px;
  background: rgba(217,122,43,0.60);
  transform: translate(-50%, -50%);
  animation: fadeDot .7s ease forwards;
  z-index: 10;
}
@keyframes fadeDot{
  to { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
}

.toast{
  position:absolute;
  bottom:14px; left:50%;
  transform: translateX(-50%) translateY(12px);
  opacity:0;
  padding:10px 14px;
  border-radius: 999px;
  background: rgba(0,0,0,0.60);
  border:1px solid rgba(255,255,255,0.14);
  color:#fff;
  transition: all .18s ease;
  z-index: 60;
}
.toast.show{opacity:1; transform: translateX(-50%) translateY(0px);}
`;
