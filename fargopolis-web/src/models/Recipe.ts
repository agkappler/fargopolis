
import Ingredient from "./Ingredient";
import RecipeStep from "./RecipeStep";

export default class Recipe {
    recipeId: string;
    name: string;
    description: string;
    quantity: string;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    totalCalories: number;
    avatarId: string | undefined;
    ingredients?: Ingredient[];
    steps?: RecipeStep[];

    constructor(
        recipeId: string,
        name: string,
        description: string,
        quantity: string,
        prepTimeMinutes: number,
        cookTimeMinutes: number,
        totalCalories: number
    ) {
        this.recipeId = recipeId;
        this.name = name;
        this.description = description;
        this.quantity = quantity;
        this.prepTimeMinutes = prepTimeMinutes;
        this.cookTimeMinutes = cookTimeMinutes;
        this.totalCalories = totalCalories;
    }
}