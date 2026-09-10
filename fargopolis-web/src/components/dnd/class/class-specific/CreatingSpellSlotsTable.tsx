import { Table, Text } from "@chakra-ui/react";
import React from "react";

interface CreatingSpellSlotsTableProps {
    creatingSpellSlots: { spell_slot_level: number, sorcery_point_cost: number }[]
}

interface SorcerySpellSlot {
    spell_slot_level: number;
    sorcery_point_cost: number;
}

export const CreatingSpellSlotsTable: React.FC<CreatingSpellSlotsTableProps> = ({ creatingSpellSlots }) => {
    return <><Text textAlign="center">Creating Spell Slots</Text>
        <Table.ScrollArea borderWidth="1px" rounded="md">
            <Table.Root>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>Spell Slot Level</Table.Cell>
                        {creatingSpellSlots.map((slot: SorcerySpellSlot) => (
                            <Table.Cell textAlign="center" key={slot.spell_slot_level}>{slot.spell_slot_level}</Table.Cell>
                        ))}
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell>Sorcery Points</Table.Cell>
                        {creatingSpellSlots.map((slot: SorcerySpellSlot) => (
                            <Table.Cell textAlign="center" key={slot.sorcery_point_cost}>{slot.sorcery_point_cost}</Table.Cell>
                        ))}
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </Table.ScrollArea>
    </>
}
