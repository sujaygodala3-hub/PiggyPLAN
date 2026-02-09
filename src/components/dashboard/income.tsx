import * as React from 'react';
import axios from "axios";
import { useState, useEffect } from "react";

import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { chart_income_dataset } from './datasets';

const chartSetting = {
  width: 400,
  height: 200,
};

type Item = {
  id: number;
  label: string;
  value: number;
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
          { params: { tranType: 'Income' }}
        );
        console.log("Income count: "+data.length);
        console.log(data);
        setData(data); 

        const dataArray: Item[] = [];
        Object.keys(data).map( key => {
          let pushEnabled = true;
          const id:number = data[key].id;
          const label:string = data[key].tranCategory;
          const value:number = data[key].tranAmount;
          const objValue:number = data[key].tranAmount;

          const item:Item = {id,label,value};

          let i = 0;
          for(i=0; i < dataArray.length; i++){
            const dataId:number = dataArray[i].id;
            const dataValue:number = dataArray[i].value;
            const dataLabel:string = dataArray[i].label;

              if (label == dataLabel){
                console.log("It is exising label");
                const id:number = dataId;
                const label:string = dataLabel;
                const newValue:number = Number(dataValue) + Number(objValue);
                const value:number = newValue;
      
                const newitem:Item = {id,label,value};
                dataArray [i] = newitem;
                pushEnabled = false;
              }
          }
          if(pushEnabled){
            dataArray.push(item);
          }

        });

        console.log("dataArray count: "+dataArray.length);
        console.log(dataArray);
        chartdata.data = dataArray;

      } catch (error) {
        console.log(error);
      }    
    };
  
    getData();
  }, []);

  return (
    <PieChart
      series={[
        {
          arcLabel: (item) => `${item.value} $`,
          arcLabelMinAngle: 35,
          arcLabelRadius: '60%',
          ...chartdata,
        },
      ]}
      sx={{
        [`& .${pieArcLabelClasses.root}`]: {
          fontWeight: 'bold',
        },
      }}
      {...chartSetting}
    />
  );

};

export default Trans;