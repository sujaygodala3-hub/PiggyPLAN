import * as React from 'react';
import axios from "axios";
import { useState, useEffect } from "react";

const Trans = () => {
  const [incomeTrans, setIncomeTrans] = useState([]);
  const [expenseTrans, setExpenseTrans] = useState([]);
  const [totalIncome, setTotalIncome] = useState(Number);
  const [totalExpense, setTotalExpense] = useState(Number);
  const [total, setTotal] = useState([]);

  useEffect(() => {
    const getIncomeTrans = async () => {
      try {
        const { data } = await axios.get(
          'https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans',
          { params: { tranType: 'Income' } }
        );
        console.log("Income count: "+data.length);
        console.log(data);
        let totalAmount = 0; 

        Object.keys(data).map( key => {
          console.log("Key: " + data[key]+", value: " + data[key].tranAmount);
          totalAmount = totalAmount + Number(data[key].tranAmount);
      });
      console.log("totalAmount: " + totalAmount);

      setIncomeTrans(data); 
      setTotalIncome(totalAmount);

      } catch (error) {
        console.log(error);
      }
    }

    const getExpenseTrans = async () => {
      try {
        const { data } = await axios.get(
          'https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans',
          { params: { tranType: 'Expense' } }
        );
        console.log("Expense count: "+data.length);
        console.log(data);
        let totalAmount = 0; 

        Object.keys(data).map( key => {
          console.log("Key: " + data[key]+", value: " + data[key].tranAmount);
          totalAmount = totalAmount + Number(data[key].tranAmount);

        });
        console.log("totalAmount: " + totalAmount);

        setTotalExpense(totalAmount);
        setExpenseTrans(data); 

      } catch (error) {
        console.log(error);
      }    
    };
  
    getIncomeTrans();
    getExpenseTrans();
  
  }, []);

  return (

    <div>
      <h1 className="text-center">Total income: {totalIncome}</h1>
      <h1 className="text-center">Total expense: {totalExpense.toFixed(2)}</h1>
      <h1 className="text-center">Total balance: {(totalIncome-totalExpense).toFixed(2)}</h1>
      <br />
    </div>

  );

};

export default Trans;