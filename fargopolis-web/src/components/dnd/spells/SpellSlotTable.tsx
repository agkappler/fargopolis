import { Spellcasting } from "@/api/dnd5eapi";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

interface SpellSlotTableProps {
    spellSlots: Spellcasting
}

export const SpellSlotTable: React.FC<SpellSlotTableProps> = ({ spellSlots }) => {
    return <><Typography variant="h6" textAlign="center" mb={1}>Spell Slots</Typography>
        <TableContainer component={Paper} title="Spell Slots">
            <Table aria-label="Spell Slots">
                <TableHead>
                    <TableRow>
                        <TableCell>Level</TableCell>
                        <TableCell align="center">Level 1</TableCell>
                        <TableCell align="center">Level 2</TableCell>
                        <TableCell align="center">Level 3</TableCell>
                        <TableCell align="center">Level 4</TableCell>
                        <TableCell align="center">Level 5</TableCell>
                        <TableCell align="center">Level 6</TableCell>
                        <TableCell align="center">Level 7</TableCell>
                        <TableCell align="center">Level 8</TableCell>
                        <TableCell align="center">Level 9</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell variant="head">Slots</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_1}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_2}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_3}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_4}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_5}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_6}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_7}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_8}</TableCell>
                        <TableCell align="center">{spellSlots.spell_slots_level_9}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    </>
}