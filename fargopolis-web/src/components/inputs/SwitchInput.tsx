import { BaseInputProps } from "@/helpers/BaseInputProps";
import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import { useFormContext } from "react-hook-form";

export const SwitchInput: React.FC<BaseInputProps> = ({ label, fieldName, requiredMessage }) => {
    const { register, formState: { defaultValues } } = useFormContext();
    return <FormGroup>
        <FormControlLabel
            label={label}
            control={
                <Switch
                    {...register(fieldName, { required: requiredMessage })}
                    defaultChecked={defaultValues?.[fieldName] ?? false}
                />
            }
        />
    </FormGroup>
}