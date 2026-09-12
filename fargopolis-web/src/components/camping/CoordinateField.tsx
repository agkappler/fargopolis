import { Field, Input } from "@chakra-ui/react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { fieldBorderProps } from "../inputs/fieldStyle";
import { CampsiteFormValues } from "./CampsiteForm";
import { parseCoordinates } from "./helpers/parseCoordinates";

/** Coordinate paste field: parses on change, shows the resolved pair, blocks submit when invalid. */
export const CoordinateField: React.FC = () => {
    const { register, formState: { errors } } = useFormContext<CampsiteFormValues>();
    const [resolved, setResolved] = useState<string>();

    const reg = register("coordinates", {
        required: "Coordinates are required",
        validate: (value: string) => {
            const result = parseCoordinates(value ?? "");
            return result.ok ? true : result.error;
        },
    });

    return (
        <Field.Root invalid={!!errors.coordinates} w="full">
            <Field.Label>Coordinates*</Field.Label>
            <Input
                px="3.5"
                placeholder="44.63, -110.72"
                {...fieldBorderProps}
                {...reg}
                onChange={(e) => {
                    reg.onChange(e);
                    const result = parseCoordinates(e.target.value);
                    setResolved(result.ok ? `${result.value.lat}, ${result.value.lng}` : undefined);
                }}
            />
            {errors.coordinates ? (
                <Field.ErrorText>{errors.coordinates.message as string}</Field.ErrorText>
            ) : (
                <Field.HelperText>
                    {resolved ? `Resolved: ${resolved}` : "Paste a lat, lng pair"}
                </Field.HelperText>
            )}
        </Field.Root>
    );
};
