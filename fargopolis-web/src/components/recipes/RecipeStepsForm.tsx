import RecipeStep from "@/models/RecipeStep";
import { BasicForm } from "../inputs/BasicForm"
import { SimpleDialog } from "../ui/SimpleDialog"
import { ListInput } from "../inputs/ListInput";
import { useState } from "react";
import RequestManager from "@/helpers/RequestManager";
import { getErrorMessage } from "@/helpers/Errors";
import { useAuth } from "@clerk/react";
import { Grid, Typography } from "@mui/material";
import { TextInput } from "../inputs/TextInput";

interface RecipeStepsFormProps {
    recipeId: string;
    isOpen: boolean;
    onClose: () => void;
    recipeSteps: RecipeStep[] | undefined;
    updateSteps: () => void;
}

interface RecipeStepsFormData {
    steps: RecipeStep[];
}

export const RecipeStepsForm: React.FC<RecipeStepsFormProps> = ({ isOpen, onClose, recipeSteps, updateSteps, recipeId }) => {
    const { getToken } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string>();
    const onSubmit = async (data: RecipeStepsFormData) => {
        data.steps.forEach((step, idx) => step.stepNumber = idx + 1);
        try {
            await RequestManager.postGatewayWithAuth(`/updateStepsForRecipe/${recipeId}`, data.steps, getToken);
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateSteps();
        onClose();
    }

    return <SimpleDialog title="Instructions" isOpen={isOpen} onClose={onClose}>
        <BasicForm
            onSubmit={onSubmit}
            defaultValues={{ steps: recipeSteps ?? [] }}
            errorMessage={errorMessage}
            isClerkForm
        >
            <ListInput
                fieldName="steps"
                addText="Add Step"
                defaultItem={{ recipeId: recipeId }}
                listItemComponent={({ idx, removeButton }) => (
                    <Grid container spacing={1} key={idx} alignItems="center" marginBottom={2}>
                        <Grid size={1}>
                            <Typography variant="h6" textAlign="center">{idx + 1}.</Typography>
                        </Grid>
                        <Grid size={10}>
                            <TextInput
                                label="Description"
                                fieldName={`steps.[${idx}].description`}
                                requiredMessage="Description is required"
                            />
                        </Grid>
                        {/* <Grid size={5}>
                            <NumberInput
                                label="Total"
                                fieldName={`people[${idx}].total`}
                                requiredMessage="Total is required"
                                type={NumberInputType.Currency}
                            />
                        </Grid> */}
                        <Grid size={1}>{removeButton}</Grid>
                    </Grid>
                )}
            />
        </BasicForm>
    </SimpleDialog>
}