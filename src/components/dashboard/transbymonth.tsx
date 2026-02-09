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
  income: number;
  expense: number;
  monthYear: string;
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

          let income = Number(0);
          let expense = Number(0);

          if(type == 'Income'){
            income = Number(amount);
          }
          else if (type == 'Expense'){
            expense = Number(amount);
          }

          const item:Item = {income,expense,monthYear};

          let i = 0;
          for(i=0; i < dataArray.length; i++){
            const dataIncome:number = dataArray[i].income;
            const dataExpense:number = dataArray[i].expense;
            const dataMonth:string = dataArray[i].monthYear;

              if (monthYear == dataMonth){
                console.log("It is exising month: "+dataMonth+", new Id: "+id)+", monthYear: "+monthYear;

                if(type == 'Income'){
                  income = Number(amount) + Number(dataIncome);
                  expense =  Number(dataExpense);
                }
                else if (type == 'Expense'){
                  expense = Number(amount) + Number(dataExpense);
                  income = Number(dataIncome);
                }
                const newitem:Item = {income,expense,monthYear};
                dataArray [i] = newitem;
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
        { dataKey: 'income', label: 'Income', valueFormatter },
        { dataKey: 'expense', label: 'Expense', valueFormatter },
      ]}
      {...chartSetting}
    />

  );
};

export default Trans;