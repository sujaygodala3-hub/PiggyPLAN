// Import React so we can define a functional React component
import React from "react";

// Import the AddUser component, which contains the form/logic to add a new user
import AddUser from "../components/user/AddUser";

// Define the UserPage component using React.FC for typing
const UserPage: React.FC = () => {
  return (
    // Wrapper div that centers all content on the page
    // and stacks elements vertically
    <div
      style={{
        position: "relative",          // Allows absolute-positioned children if needed
        width: "100%",                 // Full width of the page
        display: "flex",               // Use flexbox layout
        justifyContent: "center",       // Center content horizontally
        alignItems: "center",           // Center content vertically
        flexDirection: "column",        // Stack elements top-to-bottom
      }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: "4em" }}>
        Add User
      </h1>

      {/* AddUser component renders the user creation form */}
      <AddUser />
    </div>
  );
};

// Export the UserPage component for use in routing or other parts of the app
export default UserPage;
