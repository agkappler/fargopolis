import { Spellcasting } from "@/api/dnd5eapi";
import { Heading, Table } from "@chakra-ui/react";

interface SpellSlotTableProps {
    spellSlots: Spellcasting
}

export const SpellSlotTable: React.FC<SpellSlotTableProps> = ({ spellSlots }) => {
    return <><Heading size="md" textAlign="center" mb={1}>Spell Slots</Heading>
        <Table.ScrollArea borderWidth="1px" rounded="md" title="Spell Slots">
            <Table.Root aria-label="Spell Slots">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Level</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 1</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 2</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 3</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 4</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 5</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 6</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 7</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 8</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Level 9</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row>
                        <Table.ColumnHeader>Slots</Table.ColumnHeader>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_1}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_2}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_3}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_4}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_5}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_6}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_7}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_8}</Table.Cell>
                        <Table.Cell textAlign="center">{spellSlots.spell_slots_level_9}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </Table.ScrollArea>
    </>
}
