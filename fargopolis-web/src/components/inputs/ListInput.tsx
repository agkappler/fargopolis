import { Add, Delete } from "@mui/icons-material";
import { Button, IconButton, Typography } from "@mui/material";
import React from "react";
import { useFormContext } from "react-hook-form";

interface ListInputProps<T> {
    title?: string;
    fieldName: string;
    defaultItem: T;
    listItemComponent: React.FC<{ idx: number, removeButton: React.ReactNode }>;
    addText: string;
}

export const ListInput = <T,>({ title, fieldName, defaultItem, listItemComponent, addText }: ListInputProps<T>) => {
    const methods = useFormContext();
    const items: T[] = methods.watch(fieldName);
    const addItem = () => methods.setValue(fieldName, [...items, defaultItem]);
    const removeItem = (index: number) => methods.setValue(fieldName, items.filter((_, i) => i !== index));
    return <>
        {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
        {items.map((_, idx) => (
            listItemComponent({
                idx,
                removeButton: <IconButton color="error" title="Remove" onClick={() => removeItem(idx)}><Delete /></IconButton>
            })
        ))}
        <Button variant="outlined" onClick={addItem} startIcon={<Add />}>{addText}</Button>
    </>
}