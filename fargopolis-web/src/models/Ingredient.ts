export default class Ingredient {
    ingredientId: string;
    name: string;
    quantity: string;
    calories: number;

    constructor(
        ingredientId: string,
        name: string,
        quantity: string,
        calories: number
    ) {
        this.ingredientId = ingredientId;
        this.name = name;
        this.quantity = quantity;
        this.calories = calories;
    }

}