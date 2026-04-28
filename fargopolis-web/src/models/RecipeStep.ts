export default class RecipeStep {
    stepId: string;
    recipeId: string;
    stepNumber: number;
    description: string;

    constructor(
        stepId: string,
        recipeId: string,
        stepNumber: number,
        description: string
    ) {
        this.stepId = stepId;
        this.recipeId = recipeId;
        this.stepNumber = stepNumber;
        this.description = description;
    }

}