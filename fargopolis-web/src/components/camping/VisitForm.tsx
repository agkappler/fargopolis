import { getErrorMessage } from "@/helpers/Errors";
import RequestManager, { ApiError } from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Campsite from "@/models/Campsite";
import Visit from "@/models/Visit";
import { useAuth } from "@clerk/react";
import { Grid, GridItem } from "@chakra-ui/react";
import { useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { ChipsInput } from "../inputs/ChipsInput";
import { DateInput } from "../inputs/DateInput";
import { DropdownInput } from "../inputs/DropdownInput";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";
import { RATING_OPTIONS } from "./helpers/ratingOptions";

interface VisitFormValues {
    startDate: string;
    endDate: string;
    people: string[];
    weather: string;
    rating: string;
    notes: string;
}

interface VisitFormProps {
    isOpen: boolean;
    onClose: () => void;
    campsite: Campsite;
    /** Present when editing an existing visit; absent when adding a new one. */
    visit?: Visit;
    onSaved: (campsite: Campsite) => void;
}

function toDefaults(visit: Visit | undefined): VisitFormValues {
    if (!visit) {
        return { startDate: "", endDate: "", people: [], weather: "", rating: "", notes: "" };
    }
    return {
        startDate: visit.startDate,
        endDate: visit.endDate ?? "",
        people: visit.people ?? [],
        weather: visit.weather ?? "",
        rating: visit.rating != null ? String(visit.rating) : "",
        notes: visit.notes ?? "",
    };
}

export const VisitForm: React.FC<VisitFormProps> = ({ isOpen, onClose, campsite, visit, onSaved }) => {
    const { getToken } = useAuth();
    const isEdit = visit !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();

    const onSubmit = async (data: VisitFormValues) => {
        setErrorMessage(undefined);
        if (data.endDate && data.endDate < data.startDate) {
            setErrorMessage("End date must be on or after the start date.");
            return;
        }

        const payload = {
            ...(isEdit ? { campsiteId: campsite.campsiteId, visitId: visit!.visitId } : {}),
            startDate: data.startDate,
            endDate: data.endDate || null,
            people: data.people ?? [],
            weather: data.weather?.trim() || null,
            rating: data.rating ? Number(data.rating) : null,
            notes: data.notes?.trim() || "",
        };

        try {
            const saved = await RequestManager.post<typeof payload, Campsite>(
                isEdit ? "/updateVisit" : `/addVisitToCampsite/${campsite.campsiteId}`,
                payload,
                getToken,
            );
            onSaved(saved);
            onClose();
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 409) {
                errorToast("This campsite changed elsewhere — reload and try again.");
                onClose();
                return;
            }
            setErrorMessage(getErrorMessage(error));
        }
    };

    return (
        <SimpleDialog title={isEdit ? "Edit Visit" : "Add Visit"} isOpen={isOpen} onClose={onClose}>
            <BasicForm<VisitFormValues>
                onSubmit={onSubmit}
                defaultValues={toDefaults(visit)}
                errorMessage={errorMessage}
                isClerkForm
            >
                <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={2}>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DateInput label="Start date" fieldName="startDate" requiredMessage="Start date is required" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DateInput label="End date" fieldName="endDate" />
                    </GridItem>
                    <GridItem colSpan={12}>
                        <ChipsInput label="People" fieldName="people" placeholder="Add a name and press Enter" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="Weather" fieldName="weather" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DropdownInput label="Rating (1–5)" fieldName="rating" options={RATING_OPTIONS} />
                    </GridItem>
                    <GridItem colSpan={12}>
                        <TextInput label="Notes" fieldName="notes" multilineRows={4} />
                    </GridItem>
                </Grid>
            </BasicForm>
        </SimpleDialog>
    );
};
