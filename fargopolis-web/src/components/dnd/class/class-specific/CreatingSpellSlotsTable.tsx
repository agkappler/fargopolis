import { Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import React from "react";

interface CreatingSpellSlotsTableProps {
    creatingSpellSlots: { spell_slot_level: number, sorcery_point_cost: number }[]
}

interface SorcerySpellSlot {
    spell_slot_level: number;
    sorcery_point_cost: number;
}

export const CreatingSpellSlotsTable: React.FC<CreatingSpellSlotsTableProps> = ({ creatingSpellSlots }) => {
    return <><Typography variant="body1" textAlign="center">Creating Spell Slots</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Spell Slot Level</TableCell>
                        {creatingSpellSlots.map((slot: SorcerySpellSlot) => (
                            <TableCell align="center" key={slot.spell_slot_level}>{slot.spell_slot_level}</TableCell>
                        ))}
                    </TableRow>
                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>Sorcery Points</TableCell>
                        {creatingSpellSlots.map((slot: SorcerySpellSlot) => (
                            <TableCell align="center" key={slot.sorcery_point_cost}>{slot.sorcery_point_cost}</TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    </>
}