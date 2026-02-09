export const chart_income_dataset = [
  {
    id: 1,
    label: 'Salary',
    value: 3300.28,
  },
  {
    id: 2,
    label: 'Party Time',
    value: 1200.38,
  },
  {
    id: 3,
    label: 'Others',
    value: 190.10,
  },
];

export const chart_expense_dataset = [
  {
    label: 'Rent',
    value: 1400,
  },
  {
    label: 'Utilities',
    value: 400,
  },
  {
    label: 'Food',
    value: 450,
  },
  {
    label: 'Transport',
    value: 175,
  },
  {
    label: 'Entertainment',
    value: 200,
  },
  {
    label: 'Others',
    value: 150,
  },
];

export const chart_trans_dataset = [
  {
    income: 50,
    expense: 52,
    month: 'Feb',
  },
  {
    income: 50,
    expense: 52,
    month: 'Mar',
  },
  {
    income: 50,
    expense: 52,
    month: 'Apr',
  },
  {
    income: 50,
    expense: 52,
    month: 'May',
  },
  {
    income: 50,
    expense: 52,
    month: 'June',
 },
  {
    income: 50,
    expense: 52,
    month: 'July',

  },
  {
    income: 50,
    expense: 52,
    month: 'Aug',

  },
  {
    income: 50,
    expense: 52,
    month: 'Sept',

  },
  {
    income: 50,
    expense: 52,
    month: 'Oct',

  },
  {
    income: 50,
    expense: 52,
    month: 'Nov',
  },
  {
    income: 50,
    expense: 52,
    month: 'Dec',
  },
  {
    income: 50,
    expense: 52,
    month: 'Jan',
  },
];
  
  export function valueFormatter(value: number | null) {
    return `${value} $`;
  }

  export const pieValueFormatter = (item) => `${item.value} $`;