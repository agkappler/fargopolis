import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Campsite from "@/models/Campsite";
import { useAuth } from "@clerk/react";
import { Combobox, createListCollection, Field, Grid, GridItem, Input } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { BasicForm } from "../inputs/BasicForm";
import { DropdownInput } from "../inputs/DropdownInput";
import { fieldBorderProps } from "../inputs/fieldStyle";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";
import { parseCoordinates } from "./helpers/parseCoordinates";
import { formatTravelTime, parseTravelTimeMinutes } from "./helpers/travelTime";

interface CampsiteFormValues {
    name: string;
    coordinates: string;
    region: string;
    park: string;
    travelTimeText: string;
    dyrtUrl: string;
    firepit: string;
    views: string;
    privacy: string;
    space: string;
    notes: string;
}

interface CampsiteFormProps {
    isOpen: boolean;
    onClose: () => void;
    campsiteData?: Campsite;
    existingRegions: string[];
    /** Called after a successful create/update with the saved campsite. */
    onSaved: (campsite: Campsite) => void;
}

const FIREPIT_OPTIONS = [
    { value: "", label: "Unknown" },
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
];

const RATING_OPTIONS = [
    { value: "", label: "—" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
];

function toDefaults(campsite: CampsiteFormProps["campsiteData"]): Partial<CampsiteFormValues> {
    if (!campsite) {
        return { firepit: "", views: "", privacy: "", space: "" };
    }
    return {
        name: campsite.name ?? "",
        coordinates:
            Number.isFinite(campsite.lat) && Number.isFinite(campsite.lng)
                ? `${campsite.lat}, ${campsite.lng}`
                : "",
        region: campsite.region ?? "",
        park: campsite.park ?? "",
        travelTimeText: formatTravelTime(campsite.travelTimeMinutes),
        dyrtUrl: campsite.dyrtUrl ?? "",
        firepit: campsite.firepit === true ? "yes" : campsite.firepit === false ? "no" : "",
        views: campsite.views != null ? String(campsite.views) : "",
        privacy: campsite.privacy != null ? String(campsite.privacy) : "",
        space: campsite.space != null ? String(campsite.space) : "",
        notes: campsite.notes ?? "",
    };
}

/** Coordinate paste field: parses on change, shows the resolved pair, blocks submit when invalid. */
const CoordinateField: React.FC = () => {
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

/** Region field: free text with suggestions drawn from regions other campsites already use. */
const RegionField: React.FC<{ options: string[] }> = ({ options }) => {
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

export const CampsiteForm: React.FC<CampsiteFormProps> = ({
    isOpen,
    onClose,
    campsiteData,
    existingRegions,
    onSaved,
}) => {
    const { getToken } = useAuth();
    const isEdit = campsiteData !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();

    const regionOptions = useMemo(
        () => Array.from(new Set(existingRegions.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [existingRegions],
    );

    const onSubmit = async (data: CampsiteFormValues) => {
        setErrorMessage(undefined);
        const coords = parseCoordinates(data.coordinates);
        if (!coords.ok) {
            setErrorMessage(coords.error);
            return;
        }
        const travelTimeMinutes = parseTravelTimeMinutes(data.travelTimeText);
        if (travelTimeMinutes === undefined) {
            setErrorMessage('Drive time should look like "2h 15m" or a number of minutes');
            return;
        }

        const payload = {
            ...(isEdit ? { campsiteId: campsiteData!.campsiteId } : {}),
            name: data.name.trim(),
            lat: coords.value.lat,
            lng: coords.value.lng,
            region: data.region?.trim() || null,
            park: data.park?.trim() || null,
            travelTimeMinutes,
            dyrtUrl: data.dyrtUrl?.trim() || null,
            firepit: data.firepit === "yes" ? true : data.firepit === "no" ? false : null,
            views: data.views ? Number(data.views) : null,
            privacy: data.privacy ? Number(data.privacy) : null,
            space: data.space ? Number(data.space) : null,
            notes: data.notes?.trim() || null,
        };

        try {
            const saved = await RequestManager.post<typeof payload, Campsite>(
                isEdit ? "/updateCampsite" : "/createCampsite",
                payload,
                getToken,
            );
            onSaved(saved);
            onClose();
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        }
    };

    return (
        <SimpleDialog title={isEdit ? "Edit Campsite" : "Add Campsite"} isOpen={isOpen} onClose={onClose}>
            <BasicForm<CampsiteFormValues>
                onSubmit={onSubmit}
                defaultValues={toDefaults(campsiteData) as CampsiteFormValues}
                errorMessage={errorMessage}
                isClerkForm
            >
                <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={2}>
                    <GridItem colSpan={12}>
                        <TextInput label="Name" fieldName="name" requiredMessage="Name is required" />
                    </GridItem>
                    <GridItem colSpan={12}>
                        <CoordinateField />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <RegionField options={regionOptions} />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="Park / site name" fieldName="park" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="Drive time (e.g. 2h 15m)" fieldName="travelTimeText" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="The Dyrt URL" fieldName="dyrtUrl" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DropdownInput label="Firepit" fieldName="firepit" options={FIREPIT_OPTIONS} />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DropdownInput label="Views (1–5)" fieldName="views" options={RATING_OPTIONS} />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DropdownInput label="Privacy (1–5)" fieldName="privacy" options={RATING_OPTIONS} />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DropdownInput label="Space (1–5)" fieldName="space" options={RATING_OPTIONS} />
                    </GridItem>
                    <GridItem colSpan={12}>
                        <TextInput label="Notes" fieldName="notes" multilineRows={4} />
                    </GridItem>
                </Grid>
            </BasicForm>
        </SimpleDialog>
    );
};
