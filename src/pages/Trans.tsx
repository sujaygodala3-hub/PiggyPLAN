// Import React so we can create a functional React component
import React from "react";

// Import the Trans component, which is responsible for displaying transactions
import Trans from "../components/tran/Trans";

// Define the Transactions page component using React.FC for typing
const TransPage: React.FC = () => {
  return (
    // Wrapper div that centers text content on the page
    <div
      style={{
        textAlign: "center", // Center-align all text inside this container
      }}
    >
      {/* Page heading */}
      <h1>
        Transactions
      </h1>

      {/* Trans component renders the list/details of transactions */}
      <Trans />
    </div>
  );
};

// Export the TransPage component so it can be used in routing
export default TransPage;
