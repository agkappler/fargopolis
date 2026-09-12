import { getErrorMessage } from "@/helpers/Errors";
import RequestManager, { ApiError } from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Campsite from "@/models/Campsite";
import Visit from "@/models/Visit";
import { useAuth } from "@clerk/react";
import { Field, Grid, GridItem, Input, TagsInput } from "@chakra-ui/react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { BasicForm } from "../inputs/BasicForm";
import { DropdownInput } from "../inputs/DropdownInput";
import { TextInput } from "../inputs/TextInput";
import { fieldBorderProps } from "../inputs/fieldStyle";
import { SimpleDialog } from "../ui/SimpleDialog";

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

const RATING_OPTIONS = [
    { value: "", label: "—" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
];

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

function DateField({ fieldName, label, requiredMessage }: { fieldName: "startDate" | "endDate"; label: string; requiredMessage?: string }) {
    const { register, formState: { errors } } = useFormContext<VisitFormValues>();
    const error = errors[fieldName];
    return (
        <Field.Root invalid={!!error} w="full">
            <Field.Label>{requiredMessage ? `${label}*` : label}</Field.Label>
            <Input type="date" px="3.5" {...fieldBorderProps} {...register(fieldName, { required: requiredMessage })} />
            {error && <Field.ErrorText>{error.message as string}</Field.ErrorText>}
        </Field.Root>
    );
}

function PeopleField() {
    const { control } = useFormContext<VisitFormValues>();
    return (
        <Controller
            name="people"
            control={control}
            render={({ field }) => {
                const people = field.value ?? [];
                return (
                    <Field.Root w="full">
                        <Field.Label>People</Field.Label>
                        <TagsInput.Root value={people} onValueChange={(details) => field.onChange(details.value)}>
                            <TagsInput.Control {...fieldBorderProps}>
                                {people.map((name, index) => (
                                    <TagsInput.Item key={`${name}-${index}`} index={index} value={name}>
                                        <TagsInput.ItemPreview>
                                            <TagsInput.ItemText>{name}</TagsInput.ItemText>
                                            <TagsInput.ItemDeleteTrigger />
                                        </TagsInput.ItemPreview>
                                        <TagsInput.ItemInput />
                                    </TagsInput.Item>
                                ))}
                                <TagsInput.Input placeholder="Add a name and press Enter" />
                            </TagsInput.Control>
                            <TagsInput.HiddenInput />
                        </TagsInput.Root>
                    </Field.Root>
                );
            }}
        />
    );
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
                        <DateField fieldName="startDate" label="Start date" requiredMessage="Start date is required" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DateField fieldName="endDate" label="End date" />
                    </GridItem>
                    <GridItem colSpan={12}>
                        <PeopleField />
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
