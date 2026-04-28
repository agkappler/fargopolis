import { BaseInputProps } from "@/helpers/BaseInputProps";
import { InputAdornment, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

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

    return <>
        <TextField
            fullWidth
            label={requiredMessage ? `${label}*` : label}
            {...register(fieldName, {
                required: requiredMessage,
                pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: "Enter a valid number with up to 2 decimals"
                }
            })}
            error={!!errors[fieldName]}
            helperText={errors[fieldName]?.message as string ?? ""}
            onKeyDown={onKeyDown}
            slotProps={{
                input: {
                    startAdornment: type === NumberInputType.Currency ? <InputAdornment position="start">$</InputAdornment> : undefined,
                    endAdornment: type === NumberInputType.Percentage ? <InputAdornment position="end">%</InputAdornment> : undefined,
                    inputMode: type === NumberInputType.WholeNumber ? "numeric" : "decimal",
                },
                htmlInput: { pattern: "\\d+(\\.\\d{1,2})?" }
            }}
        />
    </>
}