import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import RacialTrait from "@/models/RacialTrait";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import { useState } from "react";
import { BasicForm } from "../../inputs/BasicForm";
import { ListInput } from "../../inputs/ListInput";
import { TextInput } from "../../inputs/TextInput";
import { SimpleDialog } from "../../ui/SimpleDialog";

interface RacialTraitsFormProps {
    raceId: string;
    isOpen: boolean;
    onClose: () => void;
    racialTraits: RacialTrait[] | undefined;
    updateTraits: () => void;
}

interface RacialTraitsFormData {
    traits: RacialTrait[];
}

export const RacialTraitsForm: React.FC<RacialTraitsFormProps> = ({ isOpen, onClose, racialTraits, updateTraits, raceId }) => {
    const { getToken } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string>();
    const onSubmit = async (data: RacialTraitsFormData) => {
        try {
            await RequestManager.postGatewayWithAuth(`/races/${raceId}/updateTraits`, data.traits, getToken);
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateTraits();
        onClose();
    }

    return <SimpleDialog title="Racial Traits" isOpen={isOpen} onClose={onClose}>
        <BasicForm
            onSubmit={onSubmit}
            defaultValues={{ traits: racialTraits ?? [] }}
            errorMessage={errorMessage}
            isClerkForm
        >
            <ListInput
                fieldName="traits"
                addText="Add Trait"
                defaultItem={{}}
                listItemComponent={({ idx, removeButton }) => (
                    <Grid container spacing={1} key={idx} alignItems="center" marginBottom={2}>
                        <Grid size={5}>
                            <TextInput
                                label="Trait Name"
                                fieldName={`traits.[${idx}].name`}
                                requiredMessage="Trait name is required"
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextInput
                                label="Description"
                                fieldName={`traits.[${idx}].description`}
                                requiredMessage="Description is required"
                            />
                        </Grid>
                        <Grid size={1}>{removeButton}</Grid>
                    </Grid>
                )}
            />
        </BasicForm>
    </SimpleDialog>
}
