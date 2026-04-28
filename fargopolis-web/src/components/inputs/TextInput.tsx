import { BaseInputProps } from "@/helpers/BaseInputProps";
import { TextField } from "@mui/material"
import { useFormContext } from "react-hook-form";

interface TextInputProps extends BaseInputProps {
    multilineRows?: number;
}

export const TextInput: React.FC<TextInputProps> = ({ label, fieldName, requiredMessage, multilineRows, onChange }) => {
    const { register, formState: { errors } } = useFormContext();
    return <TextField
        fullWidth
        label={requiredMessage ? `${label}*` : label}
        {...register(fieldName, { required: requiredMessage })}
        error={!!errors[fieldName]}
        helperText={errors?.[fieldName] ? errors[fieldName]?.message as string : ""}
        multiline={multilineRows !== undefined}
        rows={multilineRows}
        onChange={onChange}
    />
}