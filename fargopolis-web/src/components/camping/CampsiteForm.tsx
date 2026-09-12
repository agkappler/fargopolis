import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Campsite from "@/models/Campsite";
import { useAuth } from "@clerk/react";
import { Grid, GridItem } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { DropdownInput } from "../inputs/DropdownInput";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";
import { CampsiteFormMapPreview } from "./CampsiteFormMapPreview";
import { CoordinateField } from "./CoordinateField";
import { RegionField } from "./RegionField";
import { parseCoordinates } from "./helpers/parseCoordinates";
import { RATING_OPTIONS } from "./helpers/ratingOptions";
import { formatTravelTime, parseTravelTimeMinutes } from "./helpers/travelTime";

export interface CampsiteFormValues {
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
                    <GridItem colSpan={12}>
                        <CampsiteFormMapPreview />
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
