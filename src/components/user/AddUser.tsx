import React, { useState } from "react";
import axios from "axios";

const AddUser = () => {
  
  // State to store the form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    password: "",
    email: "",
    phoneNumber: ""
  });

  const handleChange = (event: any) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Function to submit the form data using Axios
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      const response = await axios.post("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/users", formData);
      console.log("Post created:", response.data);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
 
    <form onSubmit={handleSubmit}>
    <h2>Register User</h2>
    <label>First Name: </label>
    <input type="string"  name="lastName" onChange={handleChange} required/>
    <br></br>
    <br></br>

    <label>Last Name: </label>
    <input type="string"  name="firstName" onChange={handleChange} required/>
    <br></br>
    <br></br>

    <label>User Name: </label>
    <input type="string"  name="userName" onChange={handleChange} required/>
    <br></br>
    <br></br>

    <label>Password: </label>
    <input type="string"  name="password" onChange={handleChange} required/>
    <br></br>
    <br></br>

    <label>Email Address: </label>
    <input type="email"  name="email" onChange={handleChange} required/>
    <br></br>
    <br></br>

    <label>Phone Number: </label>
    <input type="phonenumber"  name="phoneNumber" onChange={handleChange} required/>
    <br></br>
    <br></br>

    <button>Add User</button>
    </form>
  );
};

export default AddUser;