import { Button, Heading, IconButton } from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
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
        {title && <Heading size="md" mb="2">{title}</Heading>}
        {items.map((_, idx) => (
            listItemComponent({
                idx,
                removeButton: <IconButton aria-label="Remove" title="Remove" variant="ghost" color="ember.700" _hover={{ color: "ember.900" }} onClick={() => removeItem(idx)}><Trash2 size={18} /></IconButton>
            })
        ))}
        <Button variant="secondary" onClick={addItem}><Plus size={16} />{addText}</Button>
    </>
}
