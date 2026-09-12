import { BaseInputProps } from "@/helpers/BaseInputProps";
import { Field, Input } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { fieldBorderProps } from "./fieldStyle";

export const DateInput: React.FC<BaseInputProps> = ({ label, fieldName, requiredMessage, onChange }) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[fieldName];

    return (
        <Field.Root invalid={!!error} w="full">
            <Field.Label>{requiredMessage ? `${label}*` : label}</Field.Label>
            <Input type="date" px="3.5" {...fieldBorderProps} {...register(fieldName, { required: requiredMessage })} onChange={onChange} />
            {error && <Field.ErrorText>{error.message as string}</Field.ErrorText>}
        </Field.Root>
    );
}
