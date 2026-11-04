import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { BaseInputProps } from "@/helpers/BaseInputProps";
import { Field, Input, InputGroup } from "@chakra-ui/react";
import { get, useFormContext } from "react-hook-form";
import { fieldBorderProps } from "./fieldStyle";
import { NumberInputType } from "./numberInputType";

interface NumberInputProps extends BaseInputProps {
    type?: NumberInputType;
    /** Allow a single leading minus sign (e.g. initiative bonus). */
    allowNegative?: boolean;
    /** When either bound is set, the value must be a whole number within [min, max]. */
    min?: number;
    max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
    label,
    fieldName,
    requiredMessage,
    info,
    type = NumberInputType.WholeNumber,
    allowNegative = false,
    min,
    max,
}) => {
    const { register, formState: { errors } } = useFormContext();
    // `get` resolves nested paths like "abilityScores.str".
    const error = get(errors, fieldName);
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value ?? "";
        const allowed =
            // Allow: backspace, delete, tab, escape, enter, arrows, home/end
            ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) ||
            // Allow: Ctrl/Cmd+A/C/V/X/Z
            (e.ctrlKey || e.metaKey) && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase()) ||
            // Allow: digits
            /^[0-9]$/.test(e.key) ||
            // Allow: one decimal point if not already present
            (e.key === "." && !value.includes(".")) ||
            // Allow: one leading minus sign, if enabled
            (allowNegative && e.key === "-" && e.currentTarget.selectionStart === 0 && !value.includes("-"));
        if (!allowed) {
            e.preventDefault();
        }
    }

    const hasRange = min !== undefined || max !== undefined;
    const lo = min ?? Number.MIN_SAFE_INTEGER;
    const hi = max ?? Number.MAX_SAFE_INTEGER;

    return (
        <Field.Root invalid={!!error} w="full">
            <Field.Label>
                {requiredMessage ? `${label}*` : label}
                {info && <InfoTooltip label={info} />}
            </Field.Label>
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
                            value: allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/,
                            message: "Enter a valid number with up to 2 decimals"
                        },
                        ...(hasRange ? {
                            validate: (v: unknown) =>
                                v === "" || v == null ||
                                (Number.isInteger(Number(v)) && Number(v) >= lo && Number(v) <= hi) ||
                                `Must be a whole number from ${min ?? lo} to ${max ?? hi}`,
                        } : {}),
                    })}
                    onKeyDown={onKeyDown}
                    inputMode={type === NumberInputType.WholeNumber ? "numeric" : "decimal"}
                    pattern={allowNegative ? "-?\\d+(\\.\\d{1,2})?" : "\\d+(\\.\\d{1,2})?"}
                />
            </InputGroup>
            {error && <Field.ErrorText>{error.message as string}</Field.ErrorText>}
        </Field.Root>
    );
}
