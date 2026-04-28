import { DndItem } from "@/api/dnd5eapi"
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { OptionCell } from "./OptionCell"

interface OptionsListProps {
    subOptions: any
}

export const OptionsList: React.FC<OptionsListProps> = ({ subOptions }) => {
    return <>
        <Typography variant="body1">{`Choose ${subOptions.choose} of the following:`}</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {subOptions.from.options.map((option: { item: DndItem }, index: number) => (
                        <TableRow key={index}>
                            <TableCell>{option.item.name}</TableCell>
                            <OptionCell option={option.item} />
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </>
}