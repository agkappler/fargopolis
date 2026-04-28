import { BaseInputProps } from '@/helpers/BaseInputProps';
import { FormHelperText } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

interface DropdownInputProps extends BaseInputProps {
    options: { value: string | number; label: string }[];
    isMultiSelect?: boolean;
    onChange?: (event: SelectChangeEvent) => void;
}

export const DropdownInput: React.FC<DropdownInputProps> = ({ label, fieldName, options, requiredMessage, isMultiSelect = false, onChange }) => {
    const { control } = useFormContext();
    const id = `${label}-select`;
    return (
        <FormControl fullWidth>
            <InputLabel id={`${id}-label`}>{requiredMessage ? `${label}*` : label}</InputLabel>
            <Controller
                name={fieldName}
                control={control}
                defaultValue=""
                rules={{ required: requiredMessage }}
                render={({ field, fieldState }) => (<>
                    <Select
                        {...field}
                        labelId={`${id}-label`}
                        id={id}
                        label={label}
                        error={!!fieldState.error}
                        onChange={(event) => {
                            field.onChange(event);
                            if (onChange) {
                                onChange(event);
                            }
                        }}
                        multiple={isMultiSelect}
                    >
                        {options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {fieldState.error && (
                        <FormHelperText error>{fieldState.error.message}</FormHelperText>
                    )}
                </>)}
            />
        </FormControl>
    );
}
