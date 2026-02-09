// Import React so we can define a functional React component
import React from "react";

// Import the DateDisplay component, which shows the current date/time or related info
import DateDisplay from "../components/DateDisplay";

// About / Contact page component
const AboutPage: React.FC = () => {
  return (
    // Wrapper div that centers all content on the page
    // and stacks elements vertically
    <div
      style={{
        position: "relative",          // Allows positioned children if needed
        width: "100%",                 // Full width of the page
        display: "flex",               // Use flexbox layout
        justifyContent: "center",       // Center content horizontally
        alignItems: "center",           // Center content vertically
        flexDirection: "column",        // Stack elements top-to-bottom
      }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: "4em" }}>
        Contact Us
      </h1>

      {/* Displays the current date (and/or time) */}
      <DateDisplay />
    </div>
  );
};

// Export the AboutPage component so it can be used in routing
export default AboutPage;
