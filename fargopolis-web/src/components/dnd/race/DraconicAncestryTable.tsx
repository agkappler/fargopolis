import { DndItem } from "@/api/dnd5eapi";
import { Table } from "@chakra-ui/react";
import { DraconicAncestryRow } from "./DraconicAncestryRow";

interface DraconicAncestryTableProps {
    subOptions: { from: { options: { item: DndItem }[] } };
}

export const DraconicAncestryTable: React.FC<DraconicAncestryTableProps> = ({ subOptions }) => {
    return <>
        <Table.ScrollArea borderWidth="1px" rounded="md">
            <Table.Root size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Dragon</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Damage Type</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Breath Weapon</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {subOptions.from.options.map((option: { item: DndItem }, index: number) => (
                        <DraconicAncestryRow key={index} ancestryOption={option.item} />
                    ))}
                </Table.Body>
            </Table.Root>
        </Table.ScrollArea>
    </>;
}
