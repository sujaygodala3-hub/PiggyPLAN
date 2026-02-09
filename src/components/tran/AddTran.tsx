import React, { useState } from "react";
import axios from "axios";

const AddTran = () => {
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
      const response = await axios.post("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans", formData);
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
    <br></br>
    <br></br>
    <label>Expense Amount: </label>
    <input type="decimal" name="tranAmount" onChange={handleChange} required max={1000} min={2}/>
    <br></br>
    <br></br>
    <label>Expense Category: </label>
    <select name="tranCategory" onChange={handleChange} required>
      <option value="">Select Category</option>
      <option value="Food">Food</option>
      <option value="Transport">Transport</option>
      <option value="Entertainment">Entertainment</option>
      <option value="Other">Other</option>
    </select>
    <br></br>
    <br></br>
    <button>Add Expense</button>
    </form>
  );
};

export default AddTran;