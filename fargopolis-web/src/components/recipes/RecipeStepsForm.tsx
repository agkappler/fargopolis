import RecipeStep from "@/models/RecipeStep";
import { BasicForm } from "../inputs/BasicForm"
import { SimpleDialog } from "../ui/SimpleDialog"
import { ListInput } from "../inputs/ListInput";
import { useState } from "react";
import RequestManager from "@/helpers/RequestManager";
import { getErrorMessage } from "@/helpers/Errors";
import { useAuth } from "@clerk/react";
import { Grid, GridItem, Text } from "@chakra-ui/react";
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
            await RequestManager.post(`/updateStepsForRecipe/${recipeId}`, data.steps, getToken);
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
                    <Grid templateColumns="repeat(12, 1fr)" gap={2} key={idx} alignItems="center" marginBottom={4}>
                        <GridItem colSpan={1} mt={6}>
                            <Text fontFamily="display" fontSize="md" textAlign="center">{idx + 1}.</Text>
                        </GridItem>
                        <GridItem colSpan={10}>
                            <TextInput
                                label="Description"
                                fieldName={`steps.[${idx}].description`}
                                requiredMessage="Description is required"
                            />
                        </GridItem>
                        <GridItem colSpan={1} mt={6}>{removeButton}</GridItem>
                    </Grid>
                )}
            />
        </BasicForm>
    </SimpleDialog>
}