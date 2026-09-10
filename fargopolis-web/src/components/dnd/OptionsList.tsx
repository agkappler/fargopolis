import { DndItem } from "@/api/dnd5eapi"
import { Table, Text } from "@chakra-ui/react"
import { OptionCell } from "./OptionCell"

interface OptionsListProps {
    subOptions: any
}

export const OptionsList: React.FC<OptionsListProps> = ({ subOptions }) => {
    return <>
        <Text>{`Choose ${subOptions.choose} of the following:`}</Text>
        <Table.ScrollArea borderWidth="1px" rounded="md">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Name</Table.ColumnHeader>
                        <Table.ColumnHeader>Description</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {subOptions.from.options.map((option: { item: DndItem }, index: number) => (
                        <Table.Row key={index}>
                            <Table.Cell>{option.item.name}</Table.Cell>
                            <OptionCell option={option.item} />
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Table.ScrollArea>
    </>
}
