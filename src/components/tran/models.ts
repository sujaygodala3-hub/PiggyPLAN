 
  export type Tran = {
    id: string;
    tranUserId: string;
    tranDate: string;
    tranAmount: string;
    tranType: string;
    tranCategory: string;
  };


  export type PieChartTran = {
    id: string;
    tranUserId: string;
    tranDate: string;
    value: string;
    label: string;
  };

    //Tran Types
    export const tranTypes = [
      'Income',
      'Expense',
    ];

  //Tran Categories
  export const tranCategories = [
    'Rent',
    'Utilities',
    'Food',
    'Transport',
    'Entertainment',
    'Others',
    'Salary',
    'Part Time',
    'Others',
  ];

  export type Income = {
    value: string;
    label: string;
  };
  
  export type Incomes = {
    data: Income[];
  };