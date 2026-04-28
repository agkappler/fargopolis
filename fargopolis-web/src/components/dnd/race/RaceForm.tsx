import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import { useState } from "react";
import { BasicForm } from "../../inputs/BasicForm";
import { TextInput } from "../../inputs/TextInput";
import { SimpleDialog } from "../../ui/SimpleDialog";

interface RaceFormProps {
    isOpen: boolean;
    onClose: () => void;
    dndRace?: CustomDndRace;
    updateDndRaces: () => void;
}

export const RaceForm: React.FC<RaceFormProps> = ({ isOpen, onClose, dndRace, updateDndRaces }) => {
    const { getToken } = useAuth();
    const isEdit = dndRace !== undefined;
    const defaultRace = new CustomDndRace({ raceId: "", name: "", description: "", index: "", isCustom: true, traits: [] });
    const [errorMessage, setErrorMessage] = useState<string>();
    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    }

    // const [racialTraits, setRacialTraits] = useState<RacialTrait[]>(dndRace?.traits ?? []);

    const onSubmit = async (data: CustomDndRace) => {
        try {
            if (isEdit) {
                // await RequestManager.post("/updateBounty", data);
            } else {
                await RequestManager.postGatewayWithAuth("/createRace", data, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateDndRaces();
        closeForm();
    }

    return <SimpleDialog title={isEdit ? "Update Race" : "Add Race"} isOpen={isOpen} onClose={closeForm}>
        <BasicForm
            onSubmit={onSubmit}
            errorMessage={errorMessage}
            defaultValues={dndRace ?? defaultRace}
            isClerkForm
        >
            <Grid container spacing={2} className="mb-2">
                <Grid size={12}>
                    <TextInput
                        label="Name"
                        fieldName="name"
                        requiredMessage="Name is required"
                    />
                </Grid>
                <Grid size={12}>
                    <TextInput
                        label="Description"
                        fieldName="description"
                        requiredMessage="Description is required"
                        multilineRows={4}
                    />
                </Grid>
                <Grid size={12}>
                    {/* <ListInput
                            title={"Traits"}
                            fieldName={"traits"}
                            defaultItem={{ name: "", description: "" }}
                            addText={"Add Trait"}
                            listItemComponent={({ idx, removeButton }) => (
                                <Grid container spacing={2} key={idx}>
                                    <Grid size={3}>
                                        <Typography variant="body1">Name</Typography>
                                    </Grid>
                                    <Grid size={8}>
                                        <Typography variant="body1">Description</Typography>
                                    </Grid>
                                    <Grid size={1}>{removeButton}</Grid>
                                </Grid>
                            )}
                        /> */}
                </Grid>
            </Grid>
        </BasicForm>
    </SimpleDialog>
}