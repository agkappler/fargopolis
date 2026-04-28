import { DndItem, getRelativeUrlInfo } from "@/api/dnd5eapi"
import useSWR from "swr";
import { LoadingWrapper } from "../ui/LoadingWrapper";
import { TableCell } from "@mui/material";
import { DescriptionList } from "./DescriptionList";

interface OptionCellProps {
    option: DndItem;
}

export const OptionCell: React.FC<OptionCellProps> = ({ option }) => {
    const { data: optionData, isLoading } = useSWR(option.index, () => getRelativeUrlInfo(option.url));

    return <TableCell>
        <LoadingWrapper isLoading={isLoading} size={10}>
            {optionData && <DescriptionList descriptions={optionData.desc} />}
        </LoadingWrapper>
    </TableCell>

}