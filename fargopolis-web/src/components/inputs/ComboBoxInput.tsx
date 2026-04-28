import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { BaseInputProps } from '@/helpers/BaseInputProps';
import { Controller, useFormContext } from 'react-hook-form';

interface ComboBoxInputProps extends BaseInputProps {
    options: { value: string | number, label: string }[]
}

export const ComboBoxInput: React.FC<ComboBoxInputProps> = ({ options, label, fieldName, requiredMessage }) => {
    const { control } = useFormContext();
    return (<Controller
        name={fieldName}
        control={control}
        rules={{ required: requiredMessage }}
        render={({ field, fieldState }) => (
            <Autocomplete
                {...field}
                options={options}
                getOptionLabel={o => o.label}
                isOptionEqualToValue={(o, v) => o.value === v?.value}
                onChange={(_, value) => field.onChange(value)}
                disablePortal
                freeSolo
                renderInput={(params) => <TextField
                    {...params}
                    label={label}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                />}
            />
        )}
    />);
}
