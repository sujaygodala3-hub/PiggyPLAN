import React from 'react'
import axios from "axios";

import { lazy, Suspense, useMemo, useState } from 'react';

import {
  MRT_EditActionButtons,
  MaterialReactTable,
  // createRow,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
  useMaterialReactTable,
} from 'material-react-table';

import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { type Tran, tranTypes, tranCategories } from './models';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const Example = () => {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

  const columns = useMemo<MRT_ColumnDef<Tran>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Id',
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: 'tranDate',
        header: 'Tran Date',
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors?.tranDate,
          helperText: validationErrors?.tranDate,
          //remove any previous validation errors when user focuses on the input
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              tranDate: undefined,
            }),
          //optionally add validation checking for onBlur or onChange
        },
      },
      {
        accessorKey: 'tranAmount',
        header: 'Tran Amount',
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors?.tranAmount,
          helperText: validationErrors?.tranAmount,
          //remove any previous validation errors when user focuses on the input
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              tranAmount: undefined,
            }),
        },
      },
      {
        accessorKey: 'tranType',
        header: 'Tran Type',
        editVariant: 'select',
        editSelectOptions: tranTypes,
        muiEditTextFieldProps: {
          required: true,
          select: true,
          error: !!validationErrors?.state,
          helperText: validationErrors?.state,
        },
      },      {
        accessorKey: 'tranCategory',
        header: 'Tran Category',
        editVariant: 'select',
        editSelectOptions: tranCategories,
        muiEditTextFieldProps: {
          required: true,
          select: true,
          error: !!validationErrors?.state,
          helperText: validationErrors?.state,
        },
      },
    ],
    [validationErrors],
  );

  //call CREATE hook
  const { mutateAsync: createTran, isPending: isCreatingTran } =
    useCreateTran();

  //call READ hook
  const {
    data: fetchedTrans = [],
    isError: isLoadingTransError,
    isFetching: isFetchingTrans,
    isLoading: isLoadingTrans,
  } = useGetTrans();

  //call UPDATE hook
  const { mutateAsync: updateTran, isPending: isUpdatingTran } =
    useUpdateTran();
  
  //call DELETE hook
  const { mutateAsync: deleteUser, isPending: isDeletingTran } =
    useDeleteTran();

  //CREATE action
  const handleCreateTran: MRT_TableOptions<Tran>['onCreatingRowSave'] = async ({
    values,
    table,
  }) => {
    const newValidationErrors = validateTran(values);
    if (Object.values(newValidationErrors).some((error) => error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await createTran(values);
    table.setCreatingRow(null); //exit creating mode
  };

  //UPDATE action
  const handleSaveTran: MRT_TableOptions<Tran>['onEditingRowSave'] = async ({
    values,
    table,
  }) => {
    const newValidationErrors = validateTran(values);
    if (Object.values(newValidationErrors).some((error) => error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await updateTran(values);
    table.setEditingRow(null); //exit editing mode
  };

  //DELETE action
  const openDeleteConfirmModal = (row: MRT_Row<Tran>) => {
    if (window.confirm('Are you sure you want to delete this tran?')) {
      deleteUser(row.original.id);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: fetchedTrans,
    createDisplayMode: 'modal', //default ('row', and 'custom' are also available)
    editDisplayMode: 'modal', //default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    getRowId: (row) => row.id,
    muiToolbarAlertBannerProps: isLoadingTransError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    muiTableContainerProps: {
      sx: {
        minHeight: '500px',
      },
    },
    onCreatingRowCancel: () => setValidationErrors({}),
    onCreatingRowSave: handleCreateTran,
    onEditingRowCancel: () => setValidationErrors({}),
    onEditingRowSave: handleSaveTran,
    //optionally customize modal content
    renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Create New Tran</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {internalEditComponents} {/* or render custom edit components here */ }
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    //optionally customize modal content
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Edit Tran</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {internalEditComponents} {/* or render custom edit components here */}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => table.setEditingRow(row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => openDeleteConfirmModal(row)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        variant="contained"
        onClick={() => {
          table.setCreatingRow(true); //simplest way to open the create row modal with no default values
          //or you can pass in a row object to set default values with the `createRow` helper function
          // table.setCreatingRow(
          //   createRow(table, {
          //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
          //   }),
          // );
        }}
      >
        Create New Tran
      </Button>
    ),
    state: {
      isLoading: isLoadingTrans,
      isSaving: isCreatingTran || isUpdatingTran|| isDeletingTran,
      showAlertBanner: isLoadingTransError,
      showProgressBars: isFetchingTrans,
    },
  });

  return <MaterialReactTable table={table} />;
};

//CREATE hook (post new user to api)
function useCreateTran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tran: Tran) => {
      //send api update request here
      const response = await axios.post("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans", tran);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trans'] }), //refetch users after mutation, disabled for demo
  });
}

//READ hook (get users from api)
function useGetTrans() {
  return useQuery<Tran[]>({
    queryKey: ['trans'],
    queryFn: async () => {
      //send api request here
      const response = await axios.get("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans");
      return Promise.resolve(response.data);
    },
    refetchOnWindowFocus: false,
  });
}

//UPDATE hook (put user in api)
function useUpdateTran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tran: Tran) => {
      //send api update request here
      const response = await axios.put("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans/"+tran.id, tran);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trans'] }), //refetch users after mutation, disabled for demo
  });
}

//DELETE hook (delete user in api)
function useDeleteTran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tranId: string) => {
      //send api update request here
      const response = await axios.delete("https://6791bc30cf994cc680475051.mockapi.io/finwise/v1/trans/"+tranId);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trans'] }), //refetch users after mutation, disabled for demo
  });
}

//react query setup in App.tsx
const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
);

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <Suspense fallback={null}>
        <ReactQueryDevtoolsProduction />
      </Suspense>
    </QueryClientProvider>
  );
}

const validateRequired = (value: string) => !!value.length;

function validateTran(tran: Tran) {
  return {
    tranDate: !validateRequired(tran.tranDate) ? 'Transaction date is Required' : '',
    tranAmount: !validateRequired(tran.tranAmount) ? 'Transaction ammount is Required' : '',
    tranType: !validateRequired(tran.tranType) ? 'Transaction type is Required' : '',
    tranCategory: !validateRequired(tran.tranCategory) ? 'Transaction category is required' : '',
  };
}