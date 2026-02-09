import React from 'react'
import { useState, useEffect } from "react";
import axios from "axios";

const getTrans = () => {
  const [data, setData] = useState([]);

  // Function to fetch data using Axios
  const fetchData = async () => {
    try {
      const response = await axios.get("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Call fetchData on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1>Data Fetched Successfully 🟢</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default getTrans;