import { BaseInputProps } from "@/helpers/BaseInputProps";
import { Field, TagsInput } from "@chakra-ui/react";
import { Controller, useFormContext } from "react-hook-form";
import { fieldBorderProps } from "./fieldStyle";

interface ChipsInputProps extends Omit<BaseInputProps, "onChange"> {
    placeholder?: string;
}

/** A field for a list of free-form string values, edited as removable chips. */
export const ChipsInput: React.FC<ChipsInputProps> = ({ label, fieldName, requiredMessage, placeholder }) => {
    const { control } = useFormContext();

    return (
        <Controller
            name={fieldName}
            control={control}
            rules={{ required: requiredMessage }}
            render={({ field, fieldState }) => {
                const values: string[] = field.value ?? [];
                return (
                    <Field.Root invalid={!!fieldState.error} w="full">
                        <Field.Label>{requiredMessage ? `${label}*` : label}</Field.Label>
                        <TagsInput.Root value={values} onValueChange={(details) => field.onChange(details.value)}>
                            <TagsInput.Control {...fieldBorderProps}>
                                {values.map((value, index) => (
                                    <TagsInput.Item key={`${value}-${index}`} index={index} value={value}>
                                        <TagsInput.ItemPreview>
                                            <TagsInput.ItemText>{value}</TagsInput.ItemText>
                                            <TagsInput.ItemDeleteTrigger />
                                        </TagsInput.ItemPreview>
                                        <TagsInput.ItemInput />
                                    </TagsInput.Item>
                                ))}
                                <TagsInput.Input placeholder={placeholder} />
                            </TagsInput.Control>
                            <TagsInput.HiddenInput />
                        </TagsInput.Root>
                        {fieldState.error && <Field.ErrorText>{fieldState.error.message}</Field.ErrorText>}
                    </Field.Root>
                );
            }}
        />
    );
};
