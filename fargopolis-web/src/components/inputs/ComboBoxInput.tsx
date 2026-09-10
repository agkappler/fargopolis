import { BaseInputProps } from '@/helpers/BaseInputProps';
import { Combobox, createListCollection, Field } from '@chakra-ui/react';
import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { fieldBorderProps } from './fieldStyle';

interface ComboBoxOption {
    value: string | number;
    label: string;
}

interface ComboBoxInputProps extends BaseInputProps {
    options: ComboBoxOption[];
}

export const ComboBoxInput: React.FC<ComboBoxInputProps> = ({ options, label, fieldName, requiredMessage }) => {
    const { control } = useFormContext();
    const collection = React.useMemo(() => createListCollection({
        items: options,
        itemToValue: (item: ComboBoxOption) => String(item.value),
        itemToString: (item: ComboBoxOption) => item.label,
    }), [options]);

    return (
        <Controller
            name={fieldName}
            control={control}
            rules={{ required: requiredMessage }}
            render={({ field, fieldState }) => {
                const selected: ComboBoxOption | string | undefined = field.value;
                const selectedOption = typeof selected === "object" && selected !== null ? selected : undefined;

                return (
                    <Field.Root invalid={!!fieldState.error} w="full">
                        <Field.Label>{label}</Field.Label>
                        <Combobox.Root
                            collection={collection}
                            allowCustomValue
                            value={selectedOption ? [String(selectedOption.value)] : []}
                            defaultInputValue={selectedOption?.label ?? (typeof selected === "string" ? selected : "")}
                            onValueChange={(details) => {
                                const item = details.items[0];
                                if (item) {
                                    field.onChange(item);
                                } else if (details.value[0] !== undefined) {
                                    field.onChange(details.value[0]);
                                }
                            }}
                            onInputValueChange={({ inputValue, reason }) => {
                                if (reason === "input-change") {
                                    const match = options.find((option) => option.label === inputValue);
                                    field.onChange(match ?? inputValue);
                                }
                            }}
                            onInteractOutside={field.onBlur}
                        >
                            <Combobox.Control>
                                <Combobox.Input px="3.5" {...fieldBorderProps} />
                                <Combobox.IndicatorGroup>
                                    <Combobox.ClearTrigger />
                                    <Combobox.Trigger />
                                </Combobox.IndicatorGroup>
                            </Combobox.Control>
                            <Combobox.Positioner>
                                <Combobox.Content>
                                    {options.map((option) => (
                                        <Combobox.Item item={option} key={option.value}>
                                            <Combobox.ItemText>{option.label}</Combobox.ItemText>
                                            <Combobox.ItemIndicator />
                                        </Combobox.Item>
                                    ))}
                                    <Combobox.Empty>No options</Combobox.Empty>
                                </Combobox.Content>
                            </Combobox.Positioner>
                        </Combobox.Root>
                        {fieldState.error && <Field.ErrorText>{fieldState.error.message}</Field.ErrorText>}
                    </Field.Root>
                );
            }}
        />
    );
}
