import { BaseInputProps } from "@/helpers/BaseInputProps";
import { Field, Input, InputGroup } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { fieldBorderProps } from "./fieldStyle";

export enum NumberInputType {
    Currency,
    Percentage,
    WholeNumber
}

interface NumberInputProps extends BaseInputProps {
    type?: NumberInputType;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, fieldName, requiredMessage, type = NumberInputType.WholeNumber }) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[fieldName];
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowed =
            // Allow: backspace, delete, tab, escape, enter, arrows, home/end
            ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) ||
            // Allow: Ctrl/Cmd+A/C/V/X/Z
            (e.ctrlKey || e.metaKey) && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase()) ||
            // Allow: digits
            /^[0-9]$/.test(e.key) ||
            // Allow: one decimal point if not already present
            (e.key === "." && !e.currentTarget.value?.includes("."));
        if (!allowed) {
            e.preventDefault();
        }
    }

    return (
        <Field.Root invalid={!!error} w="full">
            <Field.Label>{requiredMessage ? `${label}*` : label}</Field.Label>
            <InputGroup
                startElement={type === NumberInputType.Currency ? "$" : undefined}
                endElement={type === NumberInputType.Percentage ? "%" : undefined}
                w="full"
            >
                <Input
                    px="3.5"
                    {...fieldBorderProps}
                    {...register(fieldName, {
                        required: requiredMessage,
                        pattern: {
                            value: /^\d+(\.\d{1,2})?$/,
                            message: "Enter a valid number with up to 2 decimals"
                        }
                    })}
                    onKeyDown={onKeyDown}
                    inputMode={type === NumberInputType.WholeNumber ? "numeric" : "decimal"}
                    pattern="\d+(\.\d{1,2})?"
                />
            </InputGroup>
            {error && <Field.ErrorText>{error.message as string}</Field.ErrorText>}
        </Field.Root>
    );
}
