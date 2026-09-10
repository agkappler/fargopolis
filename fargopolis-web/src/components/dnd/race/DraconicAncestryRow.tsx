import { DndItem, getRelativeUrlInfo } from "@/api/dnd5eapi";
import { Table, Text } from "@chakra-ui/react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";

interface DraconicAncestryRowProps {
    ancestryOption: DndItem;
}

export const DraconicAncestryRow: React.FC<DraconicAncestryRowProps> = ({ ancestryOption }) => {
    const { data: ancestryInfo, isLoading } = useSWR(ancestryOption.index, () => getRelativeUrlInfo(ancestryOption.url));
    const getBreathWeaponInfo = (breathWeapon: { area_of_effect: { size: number, type: string }, dc: { dc_type: { name: string } } }) => {
        const { area_of_effect: aoe, dc } = breathWeapon;
        return `${aoe.size} ft. ${aoe.type} (${dc.dc_type.name} save)`;
    }
    const getDragonType = (name: string) => {
        return name.substring('Draconic Ancestry ('.length, name.length - 1);
    }

    return <Table.Row>
        <Table.Cell>{getDragonType(ancestryOption.name)}</Table.Cell>
        <Table.Cell>
            <LoadingWrapper isLoading={isLoading} size={10}>
                {ancestryInfo && <Text textAlign="center">{ancestryInfo.trait_specific.damage_type.name}</Text>}
            </LoadingWrapper>
        </Table.Cell>
        <Table.Cell>
            <LoadingWrapper isLoading={isLoading} size={10}>
                {ancestryInfo && <Text textAlign="center">
                    {getBreathWeaponInfo(ancestryInfo.trait_specific.breath_weapon)}
                </Text>}
            </LoadingWrapper>
        </Table.Cell>
    </Table.Row>
}
