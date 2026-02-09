import React, { useState, useEffect } from "react";
import axios from "axios";

import { BarChart } from '@mui/x-charts';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { chart_trans_dataset, valueFormatter } from './datasets';

const chartSetting = {
  yAxis: [
      {
      label: 'Currency in $',
      },
  ],
  width: 1500,
  height: 600,
  sx: {
      [`.${axisClasses.left} .${axisClasses.label}`]: {
      transform: 'translate(-20px, 0)',
      },
  },
};

type Item = {
  monthYear: string;
  salary: number;
  partTime: number;
  other: number;
  rent: number;
  utilities: number;
  food: number;
  transport: number;
  entertainment: number;
  others: number;
};

const items: Item[] = [];

const chartdata = {
  data: items,
};

const Trans = () => {

  const [items, setData] = useState<Item[]>([]);
  console.log(chartdata);

  useEffect(() => {
 
    const getData = async () => {
      try {
        const { data } = await axios.get(
          'https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans',
          { params: [{ sortyBy: 'tranDate' }]}

        );
        console.log("Income count: "+data.length);
        console.log(data);
        setData(data); 

        const dataArray: Item[] = [];
        Object.keys(data).map( key => {
          let pushEnabled = true;
          const id:number = data[key].id;
          const tranDate:string = data[key].tranDate;
          const type:string = data[key].tranType;
          const category:string = data[key].tranCategory;
          const amount:number = data[key].tranAmount;

          const date = new Date(tranDate);
          const monthYear = (date.getMonth() + 1)+"/"+(date.getFullYear());

          let salary = Number(0);
          let partTime = Number(0);
          let other = Number(0);
          let rent = Number(0);
          let utilities = Number(0);
          let food = Number(0);
          let transport = Number(0);
          let entertainment = Number(0);
          let others = Number(0);

          if(category == 'Salary'){
            salary = Number(amount);
          }
          else if (category == 'Part Time'){
            partTime = Number(amount);
          }
          else if (category == 'Other'){
            other = Number(amount);
          }          
          else if (category == 'Rent'){
            rent = Number(amount);
          }
          else if (category == 'Utilities'){
            utilities = Number(amount);
          }
          else if (category == 'Food'){
            food = Number(amount);
          }
          else if (category == 'Transport'){
            transport = Number(amount);
          }
          else if (category == 'Entertainment'){
            entertainment = Number(amount);
          }
          else if (category == 'Others'){
            others = Number(amount);
          }

          const item:Item = {monthYear,salary,partTime,other,rent,utilities,food,transport,entertainment,others};

          let i = 0;
          for(i=0; i < dataArray.length; i++){
            const dataItem:Item = dataArray[i];
            const dataMonthYear:string = dataItem.monthYear;
            salary = dataItem.salary;
            partTime = dataItem.partTime;
            other = dataItem.other;
            rent = dataItem.rent;
            utilities = dataItem.utilities;
            food = dataItem.food;
            transport = dataItem.transport;
            entertainment = dataItem.entertainment;
            others = dataItem.others;

              if (monthYear == dataMonthYear){
                console.log("It is exising month: "+dataMonthYear+", new Id: "+id+", monthYear: "+monthYear);


                if(category == 'Salary'){
                  salary = (Number(amount) + Number(salary));
                }
                else if (category == 'Part Time'){
                  partTime = (Number(amount) + Number(partTime));
                }
                else if (category == 'Other'){
                  other = (Number(amount) + Number(other));
                }          
                else if (category == 'Rent'){
                  rent = (Number(amount) + Number(rent));
                }
                else if (category == 'Utilities'){
                  utilities = (Number(amount) + Number(utilities));
                }
                else if (category == 'Food'){
                  food = (Number(amount) + Number(food));
                }
                else if (category == 'Transport'){
                  transport = (Number(amount) + Number(transport));
                }
                else if (category == 'Entertainment'){
                  entertainment = (Number(amount) + Number(entertainment));
                }
                else if (category == 'Others'){
                  others = (Number(amount) + Number(others));
                }

                const newItem:Item = {monthYear,salary,partTime,other,rent,utilities,food,transport,entertainment,others};

                dataArray [i] = newItem;
                pushEnabled = false;
              }
          }
          
          if(pushEnabled){
            dataArray.push(item);
          }
 
        });

        console.log("thirumal dataArray: "+dataArray.length);
        console.log(dataArray);
        chartdata.data = dataArray;

      } catch (error) {
        console.log(error);
      }    
    };
  
    getData();
  }, []);


  return (

    <BarChart
      dataset={chartdata.data}
      xAxis={[{ scaleType: 'band', dataKey: 'monthYear' }]}
      series={[
        { dataKey: 'salary', stack: 'Income', label: 'Salary', valueFormatter },
        { dataKey: 'partTime', stack: 'Income', label: 'Part Time', valueFormatter },
        { dataKey: 'other', stack: 'Income', label: 'Other', valueFormatter },
        { dataKey: 'rent', stack: 'Expense', label: 'Rent', valueFormatter },
        { dataKey: 'utilities', stack: 'Expense', label: 'Utilities', valueFormatter },
        { dataKey: 'food', stack: 'Expense', label: 'Food', valueFormatter },
        { dataKey: 'transport', stack: 'Expense', label: 'Transport', valueFormatter },
        { dataKey: 'entertainment', stack: 'Expense', label: 'Entertainment', valueFormatter },
        { dataKey: 'others', stack: 'Expense', label: 'Others', valueFormatter },
      ]}
      {...chartSetting}
    />

  );
};

export default Trans;