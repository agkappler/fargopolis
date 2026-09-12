import { Combobox, createListCollection, Field } from "@chakra-ui/react";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { fieldBorderProps } from "../inputs/fieldStyle";
import { CampsiteFormValues } from "./CampsiteForm";

/** Region field: free text with suggestions drawn from regions other campsites already use. */
export const RegionField: React.FC<{ options: string[] }> = ({ options }) => {
    const { control } = useFormContext<CampsiteFormValues>();
    const collection = useMemo(
        () => createListCollection({ items: options.map((o) => ({ value: o, label: o })) }),
        [options],
    );

    return (
        <Controller
            name="region"
            control={control}
            render={({ field }) => (
                <Field.Root w="full">
                    <Field.Label>Region</Field.Label>
                    <Combobox.Root
                        collection={collection}
                        allowCustomValue
                        defaultInputValue={typeof field.value === "string" ? field.value : ""}
                        onInputValueChange={({ inputValue, reason }) => {
                            if (reason === "input-change") {
                                field.onChange(inputValue);
                            }
                        }}
                        onValueChange={(details) => field.onChange(details.value[0] ?? "")}
                        onInteractOutside={field.onBlur}
                    >
                        <Combobox.Control>
                            <Combobox.Input
                                px="3.5"
                                placeholder="Breckenridge, Lyons, …"
                                {...fieldBorderProps}
                            />
                            <Combobox.IndicatorGroup>
                                <Combobox.ClearTrigger />
                                <Combobox.Trigger />
                            </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Combobox.Positioner>
                            <Combobox.Content>
                                {options.map((option) => (
                                    <Combobox.Item item={{ value: option, label: option }} key={option}>
                                        <Combobox.ItemText>{option}</Combobox.ItemText>
                                        <Combobox.ItemIndicator />
                                    </Combobox.Item>
                                ))}
                                <Combobox.Empty>Type a new region</Combobox.Empty>
                            </Combobox.Content>
                        </Combobox.Positioner>
                    </Combobox.Root>
                </Field.Root>
            )}
        />
    );
};
