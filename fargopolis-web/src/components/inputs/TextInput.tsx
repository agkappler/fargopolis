import { BaseInputProps } from "@/helpers/BaseInputProps";
import { Field, Input, Textarea } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { fieldBorderProps } from "./fieldStyle";

interface TextInputProps extends BaseInputProps {
    multilineRows?: number;
}

export const TextInput: React.FC<TextInputProps> = ({ label, fieldName, requiredMessage, multilineRows, onChange }) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[fieldName];
    const isMultiline = multilineRows !== undefined;

    return (
        <Field.Root invalid={!!error} w="full">
            <Field.Label>{requiredMessage ? `${label}*` : label}</Field.Label>
            {isMultiline
                ? <Textarea rows={multilineRows} px="3.5" py="2.5" {...fieldBorderProps} {...register(fieldName, { required: requiredMessage })} onChange={onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement> | undefined} />
                : <Input px="3.5" {...fieldBorderProps} {...register(fieldName, { required: requiredMessage })} onChange={onChange} />
            }
            {error && <Field.ErrorText>{error.message as string}</Field.ErrorText>}
        </Field.Root>
    );
}
