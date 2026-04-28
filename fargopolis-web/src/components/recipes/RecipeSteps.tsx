import RecipeStep from "@/models/RecipeStep";
import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { RecipeStepsForm } from "./RecipeStepsForm";

interface RecipeStepsProps {
    recipeId: string;
    recipeSteps: RecipeStep[];
    refreshRecipe: () => void;
}

export const RecipeSteps: React.FC<RecipeStepsProps> = ({ recipeId, recipeSteps, refreshRecipe }) => {
    const [isStepsOpen, setIsStepsOpen] = useState(false);
    const onCloseSteps = () => {
        setIsStepsOpen(false);
    }
    return <>
        <Typography variant="h6" textAlign="center">Instructions</Typography>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {(!recipeSteps || recipeSteps.length === 0) && (
                <Typography variant="body1">No steps yet!</Typography>
            )}
            {recipeSteps?.map((step) => (
                <Typography key={step.stepNumber} variant="body1">{step.stepNumber}. {step.description}</Typography>
            ))}
            <Button onClick={() => setIsStepsOpen(true)} className="justify-self-center">Manage Steps</Button>
        </Box>
        <RecipeStepsForm
            isOpen={isStepsOpen}
            onClose={onCloseSteps}
            recipeSteps={recipeSteps}
            updateSteps={refreshRecipe}
            recipeId={recipeId}
        />
    </>
}