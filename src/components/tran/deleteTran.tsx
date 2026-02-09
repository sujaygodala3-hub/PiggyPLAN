import React, { useState } from "react";
import axios from "axios";

const AddUser = () => {
  // State to store the form data
  const [formData, setFormData] = useState({
    tranUserId: "1",
    tranDate: "",
    tranAmount: "",
    tranType: "Expense",
    tranCategory: ""
  });

  const handleChange = (event: any) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Function to submit the form data using Axios
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      const response = await axios.delete("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans/1");
      console.log("Post created:", response.data);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
 
    <form onSubmit={handleSubmit}>
    <h2>Register Expense</h2>
    <label>Expense Date: </label>
    <input type="date"  name="tranDate" max={"2024-12-31"} min={"2024-01-01"} onChange={handleChange} required/>

    <button>Delete Expense</button>
    </form>
  );
};

export default AddUser;