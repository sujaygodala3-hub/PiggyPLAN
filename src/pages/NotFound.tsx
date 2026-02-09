// Import React so we can define a React component using JSX
import React from "react";

// Import Material UI components used to build the layout and styling
import { Box, Button, Typography } from "@mui/material";

// Import RouterLink so the MUI Button can navigate using react-router
import { Link as RouterLink } from "react-router-dom";

// Import your app’s route constants (used here to link back to Home)
import { ROUTES } from "../resources/routes-constants";

// 404 / Not Found page component
export default function NotFoundPage() {
  return (
    // Outer container:
    // - gives the page a minimum height
    // - centers content using CSS grid
    // - adds padding around the content
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center", p: 4 }}>
      {/* Inner container to center text/button */}
      <Box sx={{ textAlign: "center" }}>
        {/* Main title */}
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Page Not Found
        </Typography>

        {/* Subtitle / helper message */}
        <Typography sx={{ mt: 1, opacity: 0.8 }}>
          That route doesn’t exist yet.
        </Typography>

        {/* Button that routes the user back to the Home page */}
        <Button
          component={RouterLink}          // Use react-router navigation instead of a normal anchor tag
          to={ROUTES.HOMEPAGE_ROUTE}      // Route destination (Home)
          variant="contained"             // Filled MUI button style
          sx={{ mt: 3, borderRadius: 999, fontWeight: 900 }} // Spacing + pill shape + bold text
        >
          Go Home
        </Button>
      </Box>
    </Box>
  );
}
