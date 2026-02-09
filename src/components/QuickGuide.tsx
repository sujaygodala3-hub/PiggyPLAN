import React, { useMemo, useState } from "react";
import { Box, IconButton, Typography, Paper, Divider, Chip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation } from "react-router-dom";

const instructions: Record<string, string> = {
  "/": "Welcome to PiggyPLAN! Check your pet’s status, balance, and customize your pet. Long-term care earns reward. Send your pet to locations to complete activities. Longer activities earn more money but take more time. Track spending and earnings related to pet care. Use the savings account to avoid impulsive spending. Use voice commands to navigate the app hands-free. Try saying 'Go to Map' or 'Open Transactions. Use voice commands to navigate the app hands-free. Try saying 'Go to Map' or 'Open Transactions. Show a real or stuffed animal to the camera to match it with a pet in the game. Show a real or stuffed animal to the camera to match it with a pet in the game. Listen to short episodes about responsible pet ownership and long-term commitment.",
};

export default function QuickGuide() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const text = useMemo(() => {
    return (
      instructions[location.pathname] ||
      "Use this page to interact with your pet and make responsible decisions."
    );
  }, [location.pathname]);

  // ✅ Put it ABOVE your AI widget + footer
  const FAB_BOTTOM = 96; // change to 120 if still overlapping something
  const RIGHT = 24;

  // ✅ Make it impossible to be behind anything
  const TOP_Z = 99999;

  return (
    <>
      {/* Floating Help Button */}
      <Box
        sx={{
          position: "fixed",
          bottom: FAB_BOTTOM,
          right: RIGHT,
          zIndex: TOP_Z,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1,
          pointerEvents: "auto",
        }}
      >
        {/* DEBUG chip so you can confirm it exists */}
        <Chip size="small" label="Guide" />

        <IconButton
          onClick={() => setOpen((v) => !v)}
          sx={{
            backgroundColor: "#ffffff",
            boxShadow: 6,
            "&:hover": { backgroundColor: "#f5f5f5" },
          }}
        >
          <HelpOutlineIcon />
        </IconButton>
      </Box>

      {/* Instruction Panel */}
      {open && (
        <Paper
          elevation={10}
          sx={{
            position: "fixed",
            bottom: FAB_BOTTOM + 66,
            right: RIGHT,
            width: 320,
            p: 2,
            borderRadius: 3,
            zIndex: TOP_Z,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>
              Quick Guide
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Typography variant="caption" color="text.secondary">
            Page: {location.pathname}
          </Typography>
        </Paper>
      )}
    </>
  );
}
