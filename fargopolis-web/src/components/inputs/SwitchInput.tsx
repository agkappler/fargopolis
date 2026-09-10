import { BaseInputProps } from "@/helpers/BaseInputProps";
import { Switch } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";

export const SwitchInput: React.FC<BaseInputProps> = ({ label, fieldName, requiredMessage }) => {
    const { register, formState: { defaultValues } } = useFormContext();
    return (
        <Switch.Root defaultChecked={defaultValues?.[fieldName] ?? false}>
            <Switch.HiddenInput {...register(fieldName, { required: requiredMessage })} />
            <Switch.Control>
                <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>{label}</Switch.Label>
        </Switch.Root>
    );
}
