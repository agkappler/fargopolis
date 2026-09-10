import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import RacialTrait from "@/models/RacialTrait";
import { useAuth } from "@clerk/react";
import { Grid, GridItem } from "@chakra-ui/react";
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
            await RequestManager.post(`/races/${raceId}/updateTraits`, data.traits, getToken);
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
                    <Grid templateColumns="repeat(12, 1fr)" gap={2} key={idx} alignItems="center" marginBottom={4}>
                        <GridItem colSpan={5}>
                            <TextInput
                                label="Trait Name"
                                fieldName={`traits.[${idx}].name`}
                                requiredMessage="Trait name is required"
                            />
                        </GridItem>
                        <GridItem colSpan={6}>
                            <TextInput
                                label="Description"
                                fieldName={`traits.[${idx}].description`}
                                requiredMessage="Description is required"
                            />
                        </GridItem>
                        <GridItem colSpan={1}>{removeButton}</GridItem>
                    </Grid>
                )}
            />
        </BasicForm>
    </SimpleDialog>
}
