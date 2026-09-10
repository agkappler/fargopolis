import Ingredient from "@/models/Ingredient";
import { Badge, Box, Button, Heading, IconButton, Table } from "@chakra-ui/react";
import { Pencil, Plus } from "lucide-react";
import React, { useState } from "react";
import { IngredientForm } from "./IngredientForm";

interface IngredientListProps {
    recipeId: string;
    ingredients: Ingredient[];
    refreshRecipe: () => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({ recipeId, ingredients, refreshRecipe }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(undefined);
    const onClose = () => {
        setIsOpen(false);
        setSelectedIngredient(undefined);
    }

    return <>
        <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mt={2} w="full">
                <Heading size="md">Ingredients</Heading>
                <Badge>
                    {`Calories from Ingredients: ${
                        ingredients?.reduce((total, ingredient) => total + Number(ingredient.calories ?? 0), 0) ?? 0
                    }`}
                </Badge>
                <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}><Plus size={16} />Add Ingredient</Button>
            </Box>
            <Table.ScrollArea borderWidth="1px" rounded="md">
                <Table.Root aria-label="ingredient table">
                    <Table.Header>
                        <Table.Row fontWeight="bold">
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Quantity</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Calories</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {ingredients?.map((ingredient, index) => (
                            <Table.Row key={index}>
                                <Table.Cell>{ingredient.name}</Table.Cell>
                                <Table.Cell textAlign="center">{ingredient.quantity}</Table.Cell>
                                <Table.Cell textAlign="center">{ingredient.calories}</Table.Cell>
                                <Table.Cell textAlign="center">
                                    <IconButton
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Edit ingredient"
                                        onClick={() => {
                                            setSelectedIngredient(ingredient);
                                            setIsOpen(true);
                                        }}
                                    >
                                        <Pencil size={16} />
                                    </IconButton>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Table.ScrollArea>
        </Box>
        {isOpen && <IngredientForm
            recipeId={recipeId}
            isOpen={isOpen}
            onClose={onClose}
            ingredient={selectedIngredient}
            updateIngredients={refreshRecipe}
        />}
    </>
}
