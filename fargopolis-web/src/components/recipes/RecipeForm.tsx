import { FileRole } from "@/constants/FileRole";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import FileMetadata from "@/models/FileMetadata";
import Recipe from "@/models/Recipe";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import { useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { FileUpload } from "../inputs/FileUpload";
import { NumberInput } from "../inputs/NumberInput";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";

interface RecipeFormProps {
    isOpen: boolean;
    onClose: () => void;
    recipeData: Recipe | undefined;
    updateRecipe: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ isOpen, onClose, recipeData, updateRecipe }) => {
    const { getToken } = useAuth();
    const isEdit = recipeData !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();
    const onSubmit = async (data: Recipe) => {
        try {
            if (isEdit) {
                await RequestManager.postGatewayWithAuth("/updateRecipe", data, getToken);
            } else {
                await RequestManager.postGatewayWithAuth("/createRecipe", data, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateRecipe();
        onClose();
    }

    const onUpload = async (fileMetadata: FileMetadata) => {
        await RequestManager.postGatewayWithAuth(
            `/updateRecipeAvatar?recipeId=${recipeData?.recipeId}&fileId=${fileMetadata.fileId}`,
            {},
            getToken
        );
        updateRecipe();
    }

    return <SimpleDialog title={isEdit ? "Edit Recipe" : "Add Recipe"} isOpen={isOpen} onClose={onClose}>
        <BasicForm
            onSubmit={onSubmit}
            defaultValues={recipeData}
            errorMessage={errorMessage}
            isClerkForm
        >
            <Grid container spacing={2} className="mb-2">
                {isEdit && <Grid size={12}>
                    <FileUpload
                        label="Upload Image"
                        fileRole={FileRole.RecipeImage}
                        onUpload={onUpload}
                        isAvatar={true}
                        currentAvatarId={recipeData.avatarId}
                    />
                </Grid>}
                <Grid size={12}>
                    <TextInput
                        label="Name"
                        fieldName="name"
                        requiredMessage="Name is required"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <NumberInput
                        label="Prep Time (minutes)"
                        fieldName="prepTimeMinutes"
                        requiredMessage="Prep Time is required"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <NumberInput
                        label="Cook Time (minutes)"
                        fieldName="cookTimeMinutes"
                        requiredMessage="Cook Time is required"
                    />
                </Grid>
                <Grid size={6}>
                    <NumberInput
                        label="Total Calories"
                        fieldName="totalCalories"
                    />
                </Grid>
                <Grid size={6}>
                    <TextInput
                        label="Quantity Info"
                        fieldName="quantity"
                    />
                </Grid>
                <Grid size={12}>
                    <TextInput
                        label="Description"
                        fieldName="description"
                        multilineRows={4}
                    />
                </Grid>
            </Grid>
        </BasicForm>
    </SimpleDialog>
}