// Import React so we can define a functional React component
import React from "react";

// Import the Users component, which is responsible for rendering the list of users
import Users from "../components/user/Users";

// Define the UsersPage component using React.FC for typing
const UsersPage: React.FC = () => {
  return (
    // Wrapper div that centers content both horizontally and vertically
    // and stacks items in a column
    <div
      style={{
        position: "relative",          // Allows positioning of child elements if needed
        width: "100%",                 // Full width of the page
        display: "flex",               // Use flexbox for layout
        justifyContent: "center",       // Center content horizontally
        alignItems: "center",           // Center content vertically
        flexDirection: "column",        // Stack children vertically
      }}
    >
      {/* Page heading */}
      <h3 style={{ fontSize: "2em" }}>
        List of Users
      </h3>

      {/* Users component that renders the actual user list */}
      <Users />
    </div>
  );
};

// Export the UsersPage component so it can be used in routing or elsewhere
export default UsersPage;
