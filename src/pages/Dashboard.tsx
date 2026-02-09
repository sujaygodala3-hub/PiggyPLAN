// Import React so we can define a functional React component
import React from "react";

// Import dashboard components that make up the page
import Summary from "../components/dashboard/summary";
import IncomeWidget from "../components/dashboard/income";
import ExepenseWidget from "../components/dashboard/expense";
import TransWidget from "../components/dashboard/transbymonthv1";

// Dashboard page component
const DashboardPage: React.FC = () => {
  return (
    // Wrapper div that centers all dashboard content
    // and stacks items vertically
    <div
      style={{
        position: "relative",        // Allows positioned children if needed later
        width: "100%",               // Full width of the page
        display: "flex",             // Flexbox layout
        justifyContent: "center",    // Center content horizontally
        alignItems: "center",        // Center content vertically
        flexDirection: "column",     // Stack sections vertically
      }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: "4em" }}>
        Financial Summary
      </h1>

      {/* Overall financial summary component */}
      <Summary />

      {/* 
        NOTE: This section uses table elements (<tr>, <td>) purely for layout.
        In modern React apps, this would typically be replaced with Flexbox or Grid.
      */}
      <tr>
        {/* Income summary column */}
        <td>
          <h4 style={{ fontSize: "3em" }}>
            <center>Income Summary</center>
          </h4>
          {/* Widget displaying income data */}
          <IncomeWidget />
        </td>

        {/* Empty table cells used as spacing */}
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>

        {/* Expense summary column */}
        <td>
          <h4 style={{ fontSize: "3em" }}>
            <center>Expense Summary</center>
          </h4>
          {/* Widget displaying expense data */}
          <ExepenseWidget />
        </td>
      </tr>

      {/* Section title for monthly transactions */}
      <h4 style={{ fontSize: "3em" }}>
        Income and Exepenses (Monthly)
      </h4>

      {/* Widget showing income vs expenses by month */}
      <TransWidget />
    </div>
  );
};

// Export the DashboardPage so it can be used in routing
export default DashboardPage;
