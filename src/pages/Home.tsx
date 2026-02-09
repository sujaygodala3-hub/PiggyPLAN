// Import React + hooks used for state, lifecycle effects, and memoized derived values
import React, { useEffect, useMemo, useState } from "react";

// Import Material UI components used to build the page layout + UI controls
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  CircularProgress,
} from "@mui/material";

// Import RouterLink so MUI Buttons can navigate without a full page refresh
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";


// Import your app's route constants (may vary by project / file)
import { ROUTES } from "../resources/routes-constants";

import communityBg from "../images/CommunityReviews.png";

// Import types + store helpers for your PiggyPLAN game state
import {
  AnimalId,
  AccessoryId,
  GameState,
  loadGameState,
  subscribeGameState,
  setSelectedPet,
  setEquippedAccessory,
} from "../components/store/gameStore";

import InstructionsModal from "../components/InstructionsModal";

/* =======================
   SAFE ROUTE FALLBACKS (prevents TS2339 for missing ROUTES keys)
   - This creates a stable PATH object even if ROUTES keys change names.
   - Uses (ROUTES as any) to avoid TS errors if keys aren't declared on the ROUTES type.
======================= */
const PATH = {
  // Map route: tries multiple possible constant names, then falls back to "/map"
  map:
    (ROUTES as any).MAP_PAGE_ROUTE ??
    (ROUTES as any).MAP_ROUTE ??
    (ROUTES as any).ARTICLEPAGE_ROUTE ??
    "/map",

  // Transactions route: tries multiple possible constant names, then falls back to "/tran"
  tran:
    (ROUTES as any).TRANSPAGE_ROUTE ??
    (ROUTES as any).TRANPAGE_ROUTE ??
    "/tran",

  // Voice route: tries multiple possible constant names, then falls back to "/voice"
  voice:
    (ROUTES as any).VOICEPAGE_ROUTE ??
    (ROUTES as any).VOICE_ROUTE ??
    "/voice",

  // Podcast route: tries multiple possible constant names, then falls back to "/podcast"
  podcast:
    (ROUTES as any).PODCASTPAGE_ROUTE ??
    (ROUTES as any).PODCAST_ROUTE ??
    "/podcast",
};

// LocalStorage key used elsewhere for a "savings account" concept (not referenced in this file currently)
const SAVINGS_KEY = "petquest_savings_account";

type Review = {
  name: string;
  text: string;
  date: string;
};

const REVIEWS_KEY = "petquest_reviews";

// ✅ Per-pet ages (shared with Map page)



/* =======================
   THEME — MATCH NEW LOGO
   Logo colors: Black + Gold (PET) + Brown (QUEST) + White outline
   - Centralized theme tokens so the page stays visually consistent.
======================= */
/* =======================
   THEME — PIG BRAND (BACKWARD COMPATIBLE)
   Keeps old variable names so NOTHING breaks
======================= */

const fontBody =
  "'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const fontDisplay =
  "'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

// Backgrounds
const bg0 = "#050406";
const bg1 = "#0B070A";
const surface = "rgba(22, 14, 18, 0.82)";
const surface2 = "rgba(28, 18, 22, 0.86)";
const stroke = "rgba(255,214,224,0.18)";

// 🐷 NEW pig brand colors
const brandPink = "#FFD6E0";
const brandPinkStrong = "#FF9BB3";
const brandPinkSoft = "rgba(255,182,193,0.32)";
const brandRose = "#C97A8A";

// 🔁 ALIASES (THIS FIXES EVERY ERROR)
const brandGold = brandPinkStrong;
const brandGoldSoft = brandPinkSoft;
const brandGoldDark = brandRose;

const brandBrown = "#FFB6C9";
const brandBrownSoft = "rgba(255,182,193,0.28)";
const brandBrownDark = "#C97A8A";

// Text
const text0 = "#FFF2F6";
const text1 = "rgba(255,242,246,0.78)";
const text2 = "rgba(255,242,246,0.60)";

// Glow / depth
const glow = "rgba(255,155,179,0.28)";
const glowSoft = "rgba(255,182,193,0.18)";

// Accent stroke
const strokeBrand = "rgba(255,182,193,0.38)";


/* =======================
   PET NAME (persisted)
   - Key for localStorage so the pet name survives refreshes.
======================= */
const PET_NAME_KEY = "petquest_pet_name";

// ✅ Per-pet ages (shared with Map page)
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


/* =======================
   PETS + ACCESSORIES
   - ANIMALS: catalog of available pets (some premium, some free).
   - ACCESSORIES: catalog of wearable items you can equip.
======================= */
const ANIMALS: Array<{
  id: AnimalId;
  name: string;
  emoji: string;
  premium?: boolean;
  price?: number;
}> = [
  // 🐷 MAIN PET (DEFAULT)
  { id: "pig" as AnimalId, name: "Pig", emoji: "🐷" },

  // Free pets
  { id: "dog" as AnimalId, name: "Dog", emoji: "🐶" },
  { id: "cat" as AnimalId, name: "Cat", emoji: "🐱" },
  { id: "fox" as AnimalId, name: "Fox", emoji: "🦊" },
  { id: "bunny" as AnimalId, name: "Bunny", emoji: "🐰" },

  // Premium pets
  { id: "unicorn" as AnimalId, name: "Unicorn", emoji: "🦄", premium: true, price: 450 },
  { id: "snake" as AnimalId, name: "Snake", emoji: "🐍", premium: true, price: 400 },
  { id: "panda" as AnimalId, name: "Panda", emoji: "🐼", premium: true, price: 500 },
  { id: "dragon" as AnimalId, name: "Dragon", emoji: "🐲", premium: true, price: 500 },
];



// Simple accessory catalog shown in the dashboard
const ACCESSORIES: Array<{ id: AccessoryId; label: string }> = [
  { id: "collar" as AccessoryId, label: "Collar" },
  { id: "leash" as AccessoryId, label: "Leash" },
  { id: "headband" as AccessoryId, label: "Headband" },
];

/* =======================
   BADGE TILE (logo theme)
   - Small UI element that visually represents whether a badge is unlocked.
======================= */
function BadgeTile({
  title,
  unlocked,
  kind = "gold",
}: {
  title: string;
  unlocked: boolean;
  kind?: "gold" | "brown";
}) {
  const activeBorder =
  kind === "gold"
    ? "rgba(255,155,179,0.65)"
    : "rgba(201,122,138,0.65)";

const activeGlow =
  kind === "gold"
    ? "rgba(255,155,179,0.28)"
    : "rgba(201,122,138,0.28)";

const activeBg =
  kind === "gold"
    ? "linear-gradient(135deg, rgba(255,182,193,0.24), rgba(255,255,255,0.04))"
    : "linear-gradient(135deg, rgba(201,122,138,0.22), rgba(255,255,255,0.04))";


  return (
    <Box
      sx={{
        width: 124,
        height: 74,
        borderRadius: 4,
        border: unlocked ? `1px solid ${activeBorder}` : `1px solid ${stroke}`,
        background: unlocked
          ? activeBg
          : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        boxShadow: unlocked
          ? `0 16px 40px ${activeGlow}, inset 0 1px 0 rgba(255,255,255,0.10)`
          : "inset 0 1px 0 rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        opacity: 1,
      }}
    >
      {/* subtle sheen */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: unlocked
            ? "radial-gradient(600px 200px at 30% 0%, rgba(255,255,255,0.10), transparent 55%)"
            : "radial-gradient(600px 200px at 30% 0%, rgba(255,255,255,0.06), transparent 55%)",
        }}
      />

      <Typography
        sx={{
          fontFamily: fontBody,
          fontWeight: 950,
          color: unlocked ? text0 : text1,
          fontSize: 12,
          textAlign: "center",
          px: 1,
          zIndex: 1,
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}



/* =======================
   PET PREVIEW (gold/brown accessories)
   - Circular avatar that shows the pet emoji and any equipped accessories.
======================= */
function PetPreview({
  emoji,
  equipped,
  size = 92,
}: {
  emoji: string;
  equipped: Record<AccessoryId, boolean>;
  size?: number;
}) {
  return (
    <Box
    
      sx={{
        // Circle container
        width: size,
        height: size,
        borderRadius: "50%",

        // Brand border + background gradient
        border: `1px solid ${strokeBrand}`,
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), ${brandGoldSoft} 42%, rgba(0,0,0,0.92))`,

        // Outer glow + inner highlight for depth
        boxShadow: `0 18px 44px ${glowSoft}, inset 0 1px 0 rgba(255,255,255,0.10)`,

        // Center contents
        display: "grid",
        placeItems: "center",

        // For positioning accessory overlays
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pet emoji */}
      <Typography
        sx={{
          fontSize: Math.max(36, Math.floor(size * 0.5)),
          transform: "translateY(2px)",
        }}
      >
        {emoji}
      </Typography>

      {/* Headband accessory overlay */}
      {equipped.headband && (
        <Box
          sx={{
            position: "absolute",
            top: Math.floor(size * 0.14),
            width: Math.floor(size * 0.52),
            height: Math.max(8, Math.floor(size * 0.1)),
            borderRadius: 999,
            background: `linear-gradient(90deg, ${brandBrownSoft}, ${brandGold})`,
            boxShadow: `0 12px 22px rgba(0,0,0,0.35)`,
            border: `1px solid rgba(255,255,255,0.18)`,
          }}
        />
      )}

      {/* Collar accessory overlay */}
      {equipped.collar && (
        <Box
          sx={{
            position: "absolute",
            bottom: Math.floor(size * 0.18),
            width: Math.floor(size * 0.52),
            height: Math.max(8, Math.floor(size * 0.1)),
            borderRadius: 999,
            background: `linear-gradient(90deg, ${brandGoldSoft}, ${brandBrown})`,
            boxShadow: `0 12px 22px rgba(0,0,0,0.35)`,
            border: `1px solid rgba(255,255,255,0.18)`,
          }}
        />
      )}

      {/* Leash accessory overlay */}
      {equipped.leash && (
        <Box
          sx={{
            position: "absolute",
            right: Math.floor(size * 0.13),
            bottom: Math.floor(size * 0.12),
            width: Math.max(8, Math.floor(size * 0.1)),
            height: Math.floor(size * 0.38),
            borderRadius: 999,
            background: "#000",
            opacity: 0.4,
          }}
        />
      )}
    </Box>
  );
}

// 👶🧑🧓 Pet Age helper (based on daysPlayed)
function getPetAgeLabel(daysPlayed: number) {
  const d = Math.max(0, daysPlayed || 0);

  // Simple tiers — tweak thresholds however you want
  if (d < 5) return "Baby";
  if (d < 20) return "Middle Age";
  return "Older";
}

function getPetEmojiForAge(animalEmoji: string, petAgeDays: number) {
  // Always show the real animal emoji (no baby stage)
  return animalEmoji;
}



/* =======================
   HOME PAGE
   - Main landing page showing dashboard + map preview + pet selection + podcast + beliefs.
======================= */
export default function HomePage(
  { instructionsNonce }: { instructionsNonce?: number }
): React.ReactElement {
  const [reviews, setReviews] = useState<Review[]>([]);
const [reviewName, setReviewName] = useState("");
const [reviewText, setReviewText] = useState("");
const navigate = useNavigate();
const location = useLocation();

useEffect(() => {
  const saved = localStorage.getItem(REVIEWS_KEY);
  if (saved) setReviews(JSON.parse(saved));
}, []);

useEffect(() => {
  if (!instructionsNonce) return;
  setShowInstructions(true);
}, [instructionsNonce]);


const addReview = () => {
  if (!reviewName.trim() || !reviewText.trim()) return;

  const next = [
    {
      name: reviewName.trim(),
      text: reviewText.trim(),
      date: new Date().toLocaleDateString(),
    },
    ...reviews,
  ];

  setReviews(next);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
  setReviewName("");
  setReviewText("");
};

const DEFAULT_PET_AGE_DAYS = 10;

const INSTRUCTIONS_KEY = "petquest_instructions_seen";

const deleteReview = (index: number) => {
  const next = reviews.filter((_, i) => i !== index);
  setReviews(next);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
};

  
    // ✅ Instructions modal (shows once on first open)
    const [showInstructions, setShowInstructions] = useState<boolean>(() => {
      try {
        return !localStorage.getItem(INSTRUCTIONS_KEY);
      } catch {
        return true;
      }
    });
  
    const closeInstructions = () => {
      try {
        localStorage.setItem(INSTRUCTIONS_KEY, "true");
      } catch {
        // ignore
      }
      setShowInstructions(false);
    };
  

  // Current money balance (synced from gameStore)
  const [money, setMoney] = useState<number>(0);

  // Currently selected animal id (synced from gameStore)
  const [animalId, setAnimalIdState] = useState<AnimalId>("pig" as AnimalId);

  // Owned accessories counts (synced from gameStore)
  const [owned, setOwned] = useState<GameState["ownedAccessories"]>(
    loadGameState().ownedAccessories
  );

  // Equipped accessories boolean map (synced from gameStore)
  const [equipped, setEquipped] = useState<GameState["equippedAccessories"]>(
    loadGameState().equippedAccessories
  );

  // Badge unlock state (synced from gameStore)
  const [badges, setBadges] = useState<GameState["badges"]>(loadGameState().badges);

  // Number of days played (synced from gameStore)
  const [daysPlayed, setDaysPlayed] = useState<number>(loadGameState().daysPlayed);

  // Which pets the user owns/unlocked (synced from gameStore)
  const [ownedPets, setOwnedPets] = useState<GameState["ownedPets"]>(loadGameState().ownedPets);

  // Toggle for expanding the "more podcasts" area
  const [showMorePodcasts, setShowMorePodcasts] = useState(false);

  // ✅ Per-pet ages pulled from localStorage
  const [petAges, setPetAges] = useState<PetAges>(() => loadPetAges());

  // Current pet's age in days
  const currentPetAge = petAges[animalId] ?? 0;

  const totalAccOwned =
  (owned.collar ?? 0) + (owned.leash ?? 0) + (owned.headband ?? 0);

  const homeBadges = {
    accessory_1: totalAccOwned >= 1,
    accessory_2: totalAccOwned >= 2,
    accessory_4: totalAccOwned >= 4,

    days_5: currentPetAge >= 5,
    days_10: currentPetAge >= 10,
    days_15: currentPetAge >= 15,
    days_25: currentPetAge >= 25,
    days_50: currentPetAge >= 50,
    days_100: currentPetAge >= 100,
  };


  // ✅ Pet name state (persisted to localStorage)
  const [petName, setPetName] = useState<string>(() => {
    try {
      // Attempt to read saved pet name
      const saved = localStorage.getItem(PET_NAME_KEY);
      return saved && saved.trim() ? saved : "Buddy";
    } catch {
      // If localStorage is blocked/unavailable, fallback safely
      return "Buddy";
    }
  });

  // On mount: load initial game state and subscribe to store updates
  useEffect(() => {
    // Load once immediately for initial render
    const s = loadGameState();
    setMoney(s.money);
    setAnimalIdState(s.animalId);
    setOwned(s.ownedAccessories);
    setEquipped(s.equippedAccessories);
    setBadges(s.badges);
    setDaysPlayed(s.daysPlayed);
    setOwnedPets(s.ownedPets);

    // Subscribe to store changes; return unsubscribe cleanup function
    return subscribeGameState((next: GameState) => {
      setMoney(next.money);
      setAnimalIdState(next.animalId);
      setOwned(next.ownedAccessories);
      setEquipped(next.equippedAccessories);
      setBadges(next.badges);
      setDaysPlayed(next.daysPlayed);
      setOwnedPets(next.ownedPets);
    });
  }, []);

  // ✅ Persist petName whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PET_NAME_KEY, petName);
    } catch {
      // ignore (e.g., private mode / storage disabled)
    }
  }, [petName]);

  // ✅ Keep HomePage synced with localStorage ages (when returning from Map, tab focus, etc.)
  useEffect(() => {
    const refresh = () => setPetAges(loadPetAges());
  
    // refresh when arriving on this route (Home -> Map -> Home in SPA)
    refresh();
  
    // also refresh on tab focus
    window.addEventListener("focus", refresh);
  
    // also refresh if another tab updates localStorage
    window.addEventListener("storage", refresh);
  
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location.pathname]);
  

  useEffect(() => {
    setPetAges((prev) => {
      if (prev[animalId] != null) return prev;
  
      const next = { ...prev, [animalId]: DEFAULT_PET_AGE_DAYS };
      try {
        localStorage.setItem(PET_AGES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [animalId]);
  


  // Derived selected animal object for display (emoji/name)
  const selectedAnimal = useMemo(() => {
    const found = ANIMALS.find((a) => a.id === animalId);
    return found ?? ANIMALS[0];
  }, [animalId]);

  const displayEmoji = getPetEmojiForAge(selectedAnimal.emoji, currentPetAge);

  // Handler: pick a pet, but prevent selecting locked premium pets
  const onPickAnimal = (id: AnimalId) => {
    const pet = ANIMALS.find((a) => a.id === id);
    const isPremium = !!pet?.premium;

    // If premium and not owned, do nothing
    if (isPremium && !ownedPets?.[id]) return;

    // Update local UI state + persist to gameStore
    setAnimalIdState(id);
    setSelectedPet(id);
  };

  // Handler: equip/unequip accessory, but prevent equipping if not owned
  const onToggleEquip = (a: AccessoryId, value: boolean) => {
    // If trying to equip but you own zero of this accessory, do nothing
    if ((owned[a] ?? 0) <= 0 && value) return;

    // Update local UI state
    setEquipped((prev) => ({ ...prev, [a]: value }));

    // Persist to gameStore
    setEquippedAccessory(a, value);
  };

  // Shared card styling used throughout the page
  const cardStyle = {
    borderRadius: 5,
    background: surface,
    backdropFilter: "blur(14px)",
    border: `1px solid ${stroke}`,
    boxShadow: `0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)`,
  } as const;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(1200px 700px at 12% -10%, ${brandGoldSoft}, transparent 60%),
          radial-gradient(900px 500px at 100% 0%, ${brandBrownSoft}, transparent 55%),
          linear-gradient(180deg, ${bg0}, ${bg1})
        `,
        fontFamily: fontBody,
        color: text0,
        py: { xs: 4, md: 6 },
      }}
    >
      {/* 🔹 Instructions overlay (ON TOP of everything) */}
      <InstructionsModal open={showInstructions} onClose={closeInstructions} />
  
      <Container maxWidth="lg">
        {/* rest of your Home page content */}  
        {/* Title */}
        <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: text0,
              textShadow: "0 12px 40px rgba(0,0,0,0.55)",
            }}
          >
            Continue PiggyPLAN Permanently!
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 18, color: text1, maxWidth: 740, mx: "auto" }}>
            Care for your pet, earn money, unlock rewards, and build real-world saving habits.
          </Typography>
        </Box>

        {/* Top row */}
        <Grid container spacing={3} alignItems="stretch">
          {/* Left: Dashboard */}
          <Grid item xs={12} md={5}>
            <Card sx={cardStyle}>
              <CardContent>
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 22, color: text0 }}>
                  Your Game Dashboard
                </Typography>
                <Typography sx={{ mt: 0.5, color: text2 }}>
                  Money + pet choice + accessories + badges stay synced with the Map.
                </Typography>

                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

                {/* Balance display */}
                <Typography sx={{ color: text2 }}>Current Balance</Typography>
                <Typography sx={{ fontSize: 42, fontWeight: 950, color: brandGold, mt: 0.5 }}>
                  ${money}
                </Typography>

                {/* Current pet + name + preview */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                  <Box
                    sx={{
                      flex: 1,
                      borderRadius: 4,
                      p: 1.6,
                      border: `1px solid ${stroke}`,
                      background:
                        "linear-gradient(135deg, rgba(232,211,106,0.10), rgba(255,255,255,0.03))",
                    }}
                  >
                    <Typography sx={{ color: text2, fontSize: 13 }}>Current Pet</Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: 16, color: text0 }}>
                      {selectedAnimal.emoji} {selectedAnimal.name}{" "}
                      <span style={{ color: text1, fontWeight: 900 }}>
                      • {petName || "Buddy"} • {getPetAgeLabel(currentPetAge)} • {currentPetAge} days
                      </span>
                    </Typography>

                    {/* Name your pet input */}
                    <TextField
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="Name your pet…"
                      size="small"
                      sx={{
                        mt: 1.2,
                        width: "100%",
                        "& .MuiInputBase-root": {
                          color: text0,
                          borderRadius: 2,
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.18)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(232,211,106,0.45)",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(232,211,106,0.70)",
                        },
                      }}
                      inputProps={{ maxLength: 16 }}
                      InputProps={{
                        sx: {
                          background: "rgba(0,0,0,0.28)",
                        },
                      }}
                    />
                  </Box>

                  {/* Right-side preview of pet + equipped items */}
                  <PetPreview emoji={displayEmoji} equipped={equipped} />
                </Box>

                {/* Primary nav buttons */}
                <Box sx={{ mt: 2, display: "flex", gap: 1.2, flexWrap: "wrap" }}>
                  {/* Map button */}
                  <Button
                    component={RouterLink}
                    to={PATH.map}
                    variant="contained"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 999,
                      px: 3,
                      py: 1.2,
                      background: `linear-gradient(135deg, ${brandPink}, ${brandPinkStrong})`,
                      boxShadow: `0 14px 30px ${glow}`,
                      textTransform: "none",
                      color: text0,
                      border: "1px solid rgba(255,255,255,0.18)",
                      "&:hover": { background: `linear-gradient(135deg, ${brandBrown}, ${brandGold})` },
                    }}
                  >
                    Go to Map
                  </Button>

                  {/* Transactions button */}
                  <Button
                    component={RouterLink}
                    to={PATH.tran}
                    variant="outlined"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 999,
                      px: 3,
                      py: 1.2,
                      textTransform: "none",
                      borderColor: brandPinkStrong,
                      color: brandPinkStrong,
                      background: "rgba(255,182,193,0.08)",
                      "&:hover": {
                        background: "rgba(255,182,193,0.16)",
                        borderColor: brandRose,
                        color: text0,
                      },
                    }}
                  >
                    View Transactions
                  </Button>

                  {/* Voice AI button */}
                  <Button
                    component={RouterLink}
                    to={PATH.voice}
                    variant="contained"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 999,
                      px: 3,
                      py: 1.2,
                      textTransform: "none",
                      background: `linear-gradient(135deg, ${brandPink}, ${brandPinkStrong})`,
                      boxShadow: `0 14px 30px ${glow}`,
                      color: "#111",
                      border: "1px solid rgba(255,255,255,0.18)",
                      "&:hover": { filter: "brightness(0.96)" },
                    }}
                  >
                    Voice AI
                  </Button>

                  {/* ✅ Face AI button */}
                  <Button
                    component={RouterLink}
                    to="/face-ai"
                    variant="contained"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 999,
                      px: 3,
                      py: 1.2,
                      textTransform: "none",
                      background: `linear-gradient(135deg, ${brandPink}, ${brandPinkStrong})`,
                      boxShadow: `0 14px 30px ${glow}`,
                      color: "#111",
                      border: "1px solid rgba(255,255,255,0.18)",
                      "&:hover": { background: `linear-gradient(135deg, ${brandBrown}, ${brandGold})` },
                    }}
                  >
                    Face AI
                  </Button>

                  {/* Podcast button */}
                  <Button
                    component={RouterLink}
                    to={PATH.podcast}
                    variant="outlined"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 999,
                      px: 3,
                      py: 1.2,
                      textTransform: "none",
                      borderColor: brandPinkStrong,
                      color: brandPinkStrong,
                      background: "rgba(255,182,193,0.06)",
                      "&:hover": {
                        background: `linear-gradient(135deg, ${brandPink}, ${brandPinkStrong})`,
                        color: "#111",
                      },
                    }}
                    
                  >
                    Go to Podcast
                  </Button>
                </Box>

                {/* Accessories */}
                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />
                <Typography sx={{ fontWeight: 950, mb: 1, color: text0 }}>
                  Accessories (equip/un-equip)
                </Typography>

                {/* Accessory cards */}
                <Grid container spacing={1}>
                  {ACCESSORIES.map((a) => (
                    <Grid item xs={12} sm={4} key={a.id}>
                      <Card
                        sx={{
                          borderRadius: 4,
                          border: `1px solid ${stroke}`,
                          background: surface2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                        }}
                      >
                        <CardContent sx={{ py: 1.2 }}>
                          {/* Accessory label */}
                          <Typography sx={{ fontWeight: 950, fontSize: 13, color: text0 }}>
                            {a.label}
                          </Typography>

                          {/* Owned count (from store) */}
                          <Typography sx={{ fontSize: 12, color: text2 }}>
                            Owned: {owned[a.id] ?? 0}
                          </Typography>

                          {/* Equip toggle */}
                          <FormControlLabel
                            control={
                              <Switch
                                checked={!!equipped[a.id]}
                                onChange={(e) => onToggleEquip(a.id, e.target.checked)}
                                disabled={(owned[a.id] ?? 0) <= 0}
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": { color: brandPinkStrong },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                    backgroundColor: "rgba(255,182,193,0.55)",
                                  },

                                  "& .MuiSwitch-track": { backgroundColor: "rgba(255,255,255,0.18)" },
                                }}
                              />
                            }
                            label={
                              <span style={{ fontSize: 12, fontWeight: 900, color: text1 }}>
                                Equip
                              </span>
                            }
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Badges */}
                <Typography sx={{ fontWeight: 950, mt: 2, mb: 1, color: text0 }}>
                  Badges
                </Typography>

                {/* Days played stat */}
                <Typography sx={{ fontSize: 12, color: text2, mb: 1 }}>
                  Days played: <b style={{ color: text0 }}>10</b>
                </Typography>

                {/* Badge tiles */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <BadgeTile title="1 Accessory" unlocked={homeBadges.accessory_1} kind="gold" />
                  <BadgeTile title="2 Accessories" unlocked={homeBadges.accessory_2} kind="gold" />
                  <BadgeTile title="4 Accessories" unlocked={homeBadges.accessory_4} kind="gold" />

                  <BadgeTile title="5 Days" unlocked={homeBadges.days_5} kind="brown" />
                  <BadgeTile title="10 Days" unlocked={homeBadges.days_10} kind="brown" />
                  <BadgeTile title="15 Days" unlocked={homeBadges.days_15} kind="brown" />
                  <BadgeTile title="25 Days" unlocked={homeBadges.days_25} kind="brown" />
                  <BadgeTile title="50 Days" unlocked={homeBadges.days_50} kind="brown" />
                  <BadgeTile title="100 Days" unlocked={homeBadges.days_100} kind="brown" />
                </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Map Preview + Choose Your Pet */}
          <Grid item xs={12} md={7}>
            <Card sx={cardStyle}>
              <CardContent>
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 22, color: text0 }}>
                  Map Preview
                </Typography>
                <Typography sx={{ mt: 0.5, color: text2 }}>
                  Your pet can move to locations to earn money and improve satisfaction.
                </Typography>

                {/* Map preview container */}
                <Box
                  sx={{
                    mt: 2,
                    width: "100%",
                    height: 520,
                    borderRadius: 4,
                    overflow: "hidden",
                    border: `1px solid ${stroke}`,
                    boxShadow: `0 22px 60px rgba(0,0,0,0.55)`,
                    position: "relative",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Inline CSS for the mini-map preview UI */}
                  <style>{`
                    .miniMapWrap{position:absolute; inset:0;
                      background:
                        radial-gradient(900px 520px at 20% 0%, rgba(232,211,106,0.14), transparent 60%),
                        radial-gradient(900px 520px at 100% 10%, rgba(168,106,69,0.20), transparent 60%),
                        linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.70));
                    }
                    .miniTopHUD{position:absolute; top:14px; left:14px; right:14px;
                      display:flex; align-items:center; justify-content:space-between; gap:12px; z-index:3;}
                    .miniMoney{display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:999px;
                      border:1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35);
                      backdrop-filter: blur(10px); font-weight:900; color: rgba(246,243,234,0.92);}
                    .miniDot{width:10px; height:10px; border-radius:50%;
                      background: rgba(232,211,106,0.95); box-shadow: 0 0 0 6px rgba(232,211,106,0.18);}
                    .miniStatus{flex:1; padding:10px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.10);
                      background: rgba(0,0,0,0.28); backdrop-filter: blur(10px); color: rgba(246,243,234,0.78);
                      font-weight:800; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align:center;}
                    .miniGrid{position:absolute; inset:70px 14px 14px 14px; border-radius:18px;
                      border:1px solid rgba(255,255,255,0.10);
                      background:
                        radial-gradient(900px 520px at 30% 0%, rgba(255,255,255,0.06), transparent 55%),
                        linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
                      overflow:hidden;}
                    .miniTile{position:absolute; inset:0;
                      background:
                        radial-gradient(1200px 900px at 40% 20%, rgba(255,255,255,0.06), transparent 55%),
                        repeating-linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 42px),
                        repeating-linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 42px);
                      opacity:0.65;}
                    .miniBuilding{position:absolute; width: 210px; border-radius:16px; padding:12px 12px;
                      border:1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.34);
                      backdrop-filter: blur(12px); box-shadow: 0 18px 50px rgba(0,0,0,0.55); z-index:2;}
                    .miniBHead{display:flex; align-items:flex-start; justify-content:space-between; gap:10px;}
                    .miniBName{margin:0; font-weight:950; font-size:14px; color: rgba(246,243,234,0.92); letter-spacing:-0.01em;}
                    .miniBSub{margin:4px 0 0 0; font-weight:800; font-size:12px; color: rgba(246,243,234,0.62);}
                    .miniIcon{width:40px; height:40px; border-radius:14px; display:grid; place-items:center;
                      border:1px solid rgba(232,211,106,0.28);
                      background: linear-gradient(135deg, rgba(232,211,106,0.18), rgba(168,106,69,0.18));
                      box-shadow: 0 14px 28px rgba(232,211,106,0.14); font-size:18px;}
                    .miniPlayer{position:absolute; left:50%; top:50%; transform: translate(-50%, -50%);
                      width:64px; height:64px; border-radius:18px;
                      border:1px solid rgba(232,211,106,0.35);
                      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(232,211,106,0.10) 45%, rgba(0,0,0,0.88));
                      box-shadow: 0 18px 44px rgba(232,211,106,0.18), inset 0 1px 0 rgba(255,255,255,0.10);
                      display:grid; place-items:center; z-index:3;}
                    .miniPetEmoji{font-size:30px; transform: translateY(1px);}
                    .miniAccHeadband{position:absolute; top:9px; left:50%; transform: translateX(-50%);
                      width:34px; height:9px; border-radius:999px;
                      background: linear-gradient(90deg, rgba(168,106,69,0.75), rgba(232,211,106,0.95));
                      border:1px solid rgba(168, 21, 21, 0.18);}
                    .miniAccCollar{position:absolute; bottom:12px; left:50%; transform: translateX(-50%);
                      width:34px; height:9px; border-radius:999px;
                      background: linear-gradient(90deg, rgba(232,211,106,0.75), rgba(168,106,69,0.95));
                      border:1px solid rgba(234, 197, 10, 0.46);}
                    .miniAccLeash{position:absolute; right:8px; bottom:10px; width:8px; height:26px; border-radius:999px; background:#000; opacity:0.35;}
                  `}</style>

                  {/* Mini map visuals (static preview) */}
                  <div className="miniMapWrap">
                    <div className="miniTopHUD">
                      {/* Mini money pill */}
                      <div className="miniMoney">
                        <span className="miniDot" />
                        <span>${Math.round(money)}</span>
                      </div>

                      {/* Mini status text */}
                      <div className="miniStatus">
                      {petName || "Buddy"} • {getPetAgeLabel(currentPetAge)} • {currentPetAge} days
                      </div>
                    </div>

                    {/* Buildings grid */}
                    <div className="miniGrid" aria-hidden="true">
                      <div className="miniTile" />

                      {/* Restaurant tile */}
                      <div className="miniBuilding" style={{ left: "8%", top: "10%" }}>
                        <div className="miniBHead">
                          <div>
                            <p className="miniBName">🍽️ Restaurant</p>
                            <p className="miniBSub">Earn money • Hunger</p>
                          </div>
                          <div className="miniIcon">🍖</div>
                        </div>
                      </div>

                      {/* Hospital tile */}
                      <div className="miniBuilding" style={{ left: "62%", top: "10%" }}>
                        <div className="miniBHead">
                          <div>
                            <p className="miniBName">🏥 Vet</p>
                            <p className="miniBSub">Earn money • Health</p>
                          </div>
                          <div className="miniIcon">🩺</div>
                        </div>
                      </div>

                      {/* Bathroom tile */}
                      <div className="miniBuilding" style={{ left: "10%", top: "64%" }}>
                        <div className="miniBHead">
                          <div>
                            <p className="miniBName">🚻 Bathroom</p>
                            <p className="miniBSub">Earn money • Needs</p>
                          </div>
                          <div className="miniIcon">🧻</div>
                        </div>
                      </div>

                      {/* Salon tile */}
                      <div className="miniBuilding" style={{ left: "62%", top: "64%" }}>
                        <div className="miniBHead">
                          <div>
                            <p className="miniBName">💇‍♀️ Salon</p>
                            <p className="miniBSub">Accessories • Costs</p>
                          </div>
                          <div className="miniIcon">🎀</div>
                        </div>
                      </div>

                      {/* Toy store tile */}
                      <div className="miniBuilding" style={{ left: "35%", top: "38%", width: "240px" }}>
                        <div className="miniBHead">
                          <div>
                            <p className="miniBName">🧸 Toy Store</p>
                            <p className="miniBSub">Fun • Costs</p>
                          </div>
                          <div className="miniIcon">🪀</div>
                        </div>
                      </div>

                      {/* Center player marker (pet) */}
                      <div className="miniPlayer" aria-label="player">
                      <span className="miniPetEmoji">{displayEmoji}</span>
                        {equipped.headband && <span className="miniAccHeadband" />}
                        {equipped.collar && <span className="miniAccCollar" />}
                        {equipped.leash && <span className="miniAccLeash" />}
                      </div>
                    </div>
                  </div>
                </Box>
              </CardContent>
            </Card>

            {/* Choose Your Pet */}
            <Card sx={{ ...cardStyle, mt: 3 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 22, color: text0 }}>
                  Choose Your Pet
                </Typography>
                <Typography sx={{ mt: 0.6, color: text2 }}>
                  Premium pets must be purchased before you can select them.
                </Typography>

                {/* Pet selection chips */}
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                  {ANIMALS.map((a) => {
                    // Whether this chip is the currently selected pet
                    const selected = a.id === animalId;

                    // Whether this pet is locked (premium but not owned)
                    const locked = !!a.premium && !ownedPets?.[a.id];

                    return (
                      <Chip
                        key={a.id}
                        // Prevent click if locked
                        onClick={() => !locked && onPickAnimal(a.id)}
                        // Show price if locked
                        label={locked ? `${a.emoji} ${a.name} • $${a.price}` : `${a.emoji} ${a.name}`}
                        sx={{
                          cursor: locked ? "not-allowed" : "pointer",
                          fontWeight: 950,
                          borderRadius: 999,
                          px: 1,
                          backgroundColor: selected ? "rgba(255,182,193,0.18)" : "rgba(255,255,255,0.04)",
                          color: selected ? text0 : text1,
                          border: selected ? `1px solid ${brandPinkStrong}` : `1px solid ${stroke}`,
                          opacity: locked ? 0.55 : 1,
                          "&:hover": locked
                            ? {}
                            : {
                              backgroundColor: selected
                              ? "rgba(255,182,193,0.26)"
                              : "rgba(255,182,193,0.12)",
                            borderColor: brandRose,
                              },
                        }}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Podcast section */}
        <Card sx={{ ...cardStyle, mt: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="stretch">
              {/* Left: Podcast text content */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${stroke}`,
                    background: surface2,
                    height: "100%",
                    p: 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <Typography sx={{ fontFamily: fontDisplay, fontWeight: 900, fontSize: 22, color: text0 }}>
                    🎙️ Podcast Spotlight
                  </Typography>

                  {/* Podcast description */}
                  <Typography sx={{ mt: 1, color: text1 }}>
                  In this solo episode of the PiggyPLAN Podcast, I break down the thinking behind building 
                  PiggyPLAN and what it took to place third at Peach State Hacks. I walk through how 
                  foundational computer science concepts, product design decisions, and rapid iteration shaped
                  the project from idea to execution. The episode offers a behind-the-scenes look at building a 
                  user-focused product under real hackathon constraints.
                  </Typography>

                  {/* Publish date */}
                  <Typography sx={{ mt: 1.2, fontSize: 13, color: text2 }}>
                    Publish Date: <b style={{ color: text0 }}>01-18-2026</b>
                  </Typography>

                  {/* Button to podcast page */}
                  <Button
                    component={RouterLink}
                    to={PATH.podcast}
                    variant="contained"
                    sx={{
                      mt: 2,
                      fontWeight: 950,
                      borderRadius: 999,
                      px: 3,
                      py: 1.1,
                      textTransform: "none",
                      background: `linear-gradient(135deg, ${brandPink}, ${brandPinkStrong})`,
                      boxShadow: `0 14px 30px ${glow}`,
                      color: "#111",
                      border: `1px solid ${strokeBrand}`,
                      "&:hover": {
                        filter: "brightness(0.95)",
                      },
                    }}
                    
                  >
                    View Podcast Page
                  </Button>

                  {/* Toggle extra podcast preview */}
                  <Button
                    onClick={() => setShowMorePodcasts((v) => !v)}
                    variant="text"
                    sx={{ mt: 1.2, fontWeight: 950, textTransform: "none", color: brandGold }}
                  >
                    {showMorePodcasts ? "Hide More Podcasts" : "View More Podcasts"}
                  </Button>

                  {/* Extra podcast preview content */}
                  {showMorePodcasts && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 3,
                        background: "rgba(232,211,106,0.08)",
                        border: `1px solid rgba(232,211,106,0.22)`,
                      }}
                    >
                      <Typography sx={{ fontWeight: 950, mb: 0.5, color: text0 }}>
                      PiggyPLAN X Beyond the Mind HOSA
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: text1 }}>
                      PiggyPLAN × Beyond the Mind HOSA is a collaborative podcast segment that...
                      </Typography>
                      <Button
                        component={RouterLink}
                        to={PATH.podcast}
                        variant="outlined"
                        sx={{
                          mt: 1.2,
                          fontWeight: 950,
                          borderRadius: 999,
                          textTransform: "none",
                          borderColor: "rgba(232,211,106,0.55)",
                          color: "rgba(232,211,106,0.95)",
                          "&:hover": { background: "rgba(232,211,106,0.10)" },
                        }}
                      >
                        Go to Podcasts
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Right: Video placeholder */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    overflow: "hidden",
                    border: `1px solid ${stroke}`,
                    background: "linear-gradient(135deg, rgba(232,211,106,0.10), rgba(255,255,255,0.02))",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "92%",
                      height: 260,
                      borderRadius: 4,
                      border: "1px dashed rgba(232,211,106,0.45)",
                      display: "grid",
                      placeItems: "center",
                      color: text0,
                      textAlign: "center",
                      p: 2,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Box sx={{ width: "100%", height: "100%" }}>
  <iframe
    src="https://youtu.be/vtTMTPbs0gE"
    title="PiggyPLAN Podcast"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    style={{
      width: "100%",
      height: "100%",
      border: "none",
      borderRadius: "12px",
    }}
  />
</Box>

                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Core Beliefs */}
<Card sx={{ ...cardStyle, mt: 3 }}>
  <CardContent>
    <Typography
      sx={{
        fontFamily: fontDisplay,
        fontWeight: 900,
        fontSize: 22,
        color: text0,
        mb: 1,
      }}
    >
      Core Beliefs of PiggyPLAN
    </Typography>

    <Typography sx={{ color: text2, fontSize: 14, mb: 2 }}>
    PiggyPLAN is built around habits that turn play into lifelong financial skills.
    </Typography>

    <Grid container spacing={2}>
      {[
        {
          title: "Play",
          text:
            "Interact with your pet through activities that reinforce smart spending and everyday money choices.",
        },
        {
          title: "Learn",
          text:
            "Develop financial literacy by understanding budgeting, saving, and how decisions impact outcomes.",
        },
        {
          title: "Allocate",
          text:
            "Decide how to divide money between needs, wants, and savings to build long-term stability.",
        },
        {
          title: "Nurture",
          text:
            "Strengthen habits over time through consistent, responsible decisions that help your pet grow.",
        },
      ].map((b) => (
        <Grid key={b.title} item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 4,
              border: `1px solid ${stroke}`,
              background: surface2,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <CardContent>
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: 18,
                  color: text0,
                }}
              >
                {b.title}
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: text2,
                }}
              >
                {b.text}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </CardContent>
</Card>

        <Card sx={{ ...cardStyle, mt: 3 }}>
  <CardContent>
  <Typography
  sx={{
    fontFamily: fontDisplay,
    fontWeight: 900,
    fontSize: 22,
    color: text0, // ✅ FORCE WHITE
  }}
>
Community Reviews
</Typography>

{/* ===== Community Reviews Background Wrapper ===== */}
<Box
  sx={{
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
    mt: 1,
    p: 3,
  }}
>
  {/* Background image */}
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      backgroundImage: `url(${communityBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      zIndex: 0,
    }}
  />

  {/* Dark translucent overlay */}
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(7,7,16,0.75), rgba(7,7,16,0.85))",
      zIndex: 1,
    }}
  />

  {/* Content layer */}
  <Box sx={{ position: "relative", zIndex: 2 }}>
    <Typography sx={{ mt: 0.5, color: text2 }}>
      Share what you think about PiggyPLAN
    </Typography>

    <Box sx={{ mt: 2, display: "grid", gap: 1.2 }}>
      <TextField
        placeholder="Your name"
        value={reviewName}
        onChange={(e) => setReviewName(e.target.value)}
        size="small"
        sx={{
          "& input": { color: text0 },
          "& .MuiOutlinedInput-root": {
            background: "rgba(0,0,0,0.28)",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.18)",
          },
          "& input::placeholder": {
            color: text2,
            opacity: 1,
          },
        }}
      />

      <TextField
        placeholder="Write your review…"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        multiline
        rows={3}
        sx={{
          "& textarea": { color: text0 },
          "& .MuiOutlinedInput-root": {
            background: "rgba(0,0,0,0.28)",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.18)",
          },
          "& textarea::placeholder": {
            color: text2,
            opacity: 1,
          },
        }}
      />

      <Button
        onClick={addReview}
        sx={{
          alignSelf: "flex-start",
          fontWeight: 950,
          borderRadius: 999,
          px: 3,
          background: `linear-gradient(135deg, ${brandPink}, ${brandPinkStrong})`,

          color: "#111",
          textTransform: "none",
        }}
      >
        Submit Review
      </Button>
    </Box>

    <Divider sx={{ my: 3 }} />

    <Grid container spacing={2}>
      {reviews.map((r, i) => (
        <Grid item xs={12} md={6} key={i}>
          <Card
            sx={{
              background: surface2,
              border: `1px solid ${stroke}`,
              borderRadius: 4,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <CardContent>
              <Typography sx={{ fontWeight: 950, color: text0 }}>
                {r.name}
              </Typography>

              <Typography sx={{ fontSize: 12, color: text2 }}>
                {r.date}
              </Typography>

              <Typography sx={{ mt: 1, color: text1 }}>
                {r.text}
              </Typography>

              <Button
                onClick={() => deleteReview(i)}
                size="small"
                sx={{
                  mt: 1,
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "none",
                  color: brandPinkStrong,
                  borderRadius: 999,
                  px: 1.5,
                  border: `1px solid rgba(255,182,193,0.35)`,
                  "&:hover": {
                    background: "rgba(232,211,106,0.10)",
                  },
                }}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
</Box>
{/* ===== End Community Reviews Background Wrapper ===== */}

  </CardContent>
</Card>

      </Container>
    </Box>
  );
}
