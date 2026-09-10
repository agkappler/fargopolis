import RecipeStep from "@/models/RecipeStep";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
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
        <Heading size="md" textAlign="center">Instructions</Heading>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {(!recipeSteps || recipeSteps.length === 0) && (
                <Text>No steps yet!</Text>
            )}
            {recipeSteps?.map((step) => (
                <Text key={step.stepNumber}>{step.stepNumber}. {step.description}</Text>
            ))}
            <Button variant="ghost" onClick={() => setIsStepsOpen(true)} justifySelf="center">Manage Steps</Button>
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
