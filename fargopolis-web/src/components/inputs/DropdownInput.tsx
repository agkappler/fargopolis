import { BaseInputProps } from '@/helpers/BaseInputProps';
import { createListCollection, Field, Select } from '@chakra-ui/react';
import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { fieldBorderProps } from './fieldStyle';

interface DropdownOption {
    value: string | number;
    label: string;
}

interface DropdownInputProps extends Omit<BaseInputProps, "onChange"> {
    options: DropdownOption[];
    isMultiSelect?: boolean;
    onChange?: (value: string | number | (string | number)[]) => void;
}

export const DropdownInput: React.FC<DropdownInputProps> = ({ label, fieldName, options, requiredMessage, isMultiSelect = false, onChange }) => {
    const { control } = useFormContext();
    const collection = React.useMemo(() => createListCollection({
        items: options,
        itemToValue: (item: DropdownOption) => String(item.value),
        itemToString: (item: DropdownOption) => item.label,
    }), [options]);

    return (
        <Controller
            name={fieldName}
            control={control}
            defaultValue={isMultiSelect ? [] : ""}
            rules={{ required: requiredMessage }}
            render={({ field, fieldState }) => {
                const selectedValues: string[] = isMultiSelect
                    ? (field.value ?? []).map(String)
                    : field.value !== undefined && field.value !== "" ? [String(field.value)] : [];

                return (
                    <Field.Root invalid={!!fieldState.error} w="full">
                        <Select.Root
                            collection={collection}
                            multiple={isMultiSelect}
                            value={selectedValues}
                            onValueChange={(details) => {
                                const rawValues = details.items.map((item) => item.value);
                                const newValue = isMultiSelect ? rawValues : (rawValues[0] ?? "");
                                field.onChange(newValue);
                                onChange?.(newValue);
                            }}
                            onInteractOutside={field.onBlur}
                        >
                            <Select.Label>{requiredMessage ? `${label}*` : label}</Select.Label>
                            <Select.Control>
                                <Select.Trigger px="3.5" {...fieldBorderProps}>
                                    <Select.ValueText placeholder={label} />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator />
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {options.map((option) => (
                                        <Select.Item item={option} key={option.value}>
                                            <Select.ItemText>{option.label}</Select.ItemText>
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                            <Select.HiddenSelect />
                        </Select.Root>
                        {fieldState.error && <Field.ErrorText>{fieldState.error.message}</Field.ErrorText>}
                    </Field.Root>
                );
            }}
        />
    );
}
