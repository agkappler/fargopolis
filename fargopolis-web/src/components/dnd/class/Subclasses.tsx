import { BaseDndResponse, getSubclasses } from "@/api/dnd5eapi";
import RequestManager from "@/helpers/RequestManager";
import Subclass from "@/models/Subclass";
import { useAuth } from "@clerk/react";
import { Plus, Wrench, Pencil } from "lucide-react";
import { Box, Grid, GridItem, Heading, NativeSelect } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { ActionMenu, MenuOption } from "../../ui/ActionMenu";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { CustomSubclassInfo } from "./CustomSubclassInfo";
import { SubclassFeaturesForm } from "./SubclassFeaturesForm";
import { SubclassForm } from "./SubclassForm";
import { SubclassInfo } from "./SubclassInfo";

interface SubclassesProps {
    classIndex: string;
}

export const Subclasses: React.FC<SubclassesProps> = ({ classIndex }) => {
    const { isLoaded, isSignedIn } = useAuth();
    const { data: apiSubclassResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>(`/classes/${classIndex}/subclasses`, () => getSubclasses(classIndex));
    const { data: customSubclasses, isLoading: isLoadingCustomSubclasses, mutate: mutateCustomSubclasses } = useSWR(
        [`/gateway/subclasses/class`, classIndex] as const,
        () => RequestManager.get<Subclass[]>(`/subclasses/class/${classIndex}`),
    );
    const subclasses = [...(apiSubclassResults?.results ?? []), ...(customSubclasses ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const [selectedSubclass, setSelectedSubclass] = useState<string>("");
    const [isCustom, setIsCustom] = useState<boolean>(false);
    const [isSubclassFormOpen, setIsSubclassFormOpen] = useState<boolean>(false);
    const [isFeaturesFormOpen, setIsFeaturesFormOpen] = useState<boolean>(false);

    // Handle initial subclass selection
    useEffect(() => {
        if (subclasses.length > 0 && !selectedSubclass) {
            const firstSubclass = subclasses[0];
            setSelectedSubclass(firstSubclass.index);
            setIsCustom('isCustom' in firstSubclass ? firstSubclass.isCustom : false);
        }
    }, [subclasses, selectedSubclass]);

    const handleSubclassChange = (subclassIndex: string) => {
        setSelectedSubclass(subclassIndex);
        const selectedSubclassObj = subclasses.find(s => s.index === subclassIndex);
        setIsCustom((selectedSubclassObj !== undefined && 'isCustom' in selectedSubclassObj) ? selectedSubclassObj.isCustom : false);
    };

    const onCloseFeatures = () => {
        setIsFeaturesFormOpen(false);
    }

    const menuOptions: MenuOption[] = [
        {
            label: "Add Subclass",
            icon: <Plus size={16} />,
            onClick: () => setIsSubclassFormOpen(true)
        },
        ...(isCustom ? [
            {
                label: "Edit Subclass",
                icon: <Pencil size={16} />,
                onClick: () => setIsSubclassFormOpen(true)
            },
            {
                label: "Manage Features",
                icon: <Wrench size={16} />,
                onClick: () => setIsFeaturesFormOpen(true)
            }
        ] : [])
    ];

    return <>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomSubclasses}>
            <Grid templateColumns="repeat(12, 1fr)">
                <GridItem colSpan={{ base: 12, md: 2 }}></GridItem>
                <GridItem colSpan={{ base: 12, md: 8 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
                        <Heading size="md" textAlign="center">Subclass Info:</Heading>
                        <NativeSelect.Root width="auto">
                            <NativeSelect.Field
                                value={selectedSubclass}
                                onChange={(e) => handleSubclassChange(e.target.value)}
                            >
                                {subclasses.map((c, index) => (
                                    <option key={index} value={c.index}>{c.name}</option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Box>
                </GridItem>
                <GridItem colSpan={{ base: 12, md: 2 }} display="flex" justifyContent="flex-end">
                    {isLoaded && isSignedIn && (
                        <ActionMenu
                            options={menuOptions}
                            ariaLabel="Subclass options"
                        />
                    )}
                </GridItem>
            </Grid>
        </LoadingWrapper>
        {selectedSubclass && (isCustom
            ? <CustomSubclassInfo subclassId={String((subclasses.find(s => s.index === selectedSubclass) as Subclass)?.subclassId ?? "")} />
            : <SubclassInfo subclassName={selectedSubclass} />)}
        <SubclassForm
            isOpen={isSubclassFormOpen}
            onClose={() => setIsSubclassFormOpen(false)}
            subclass={isCustom ? (subclasses.find(s => s.index === selectedSubclass) as Subclass) : undefined}
            updateSubclasses={() => void mutateCustomSubclasses()}
        />
        <SubclassFeaturesForm
            isOpen={isFeaturesFormOpen}
            onClose={onCloseFeatures}
            subclassId={String((subclasses.find(s => s.index === selectedSubclass) as Subclass)?.subclassId ?? "")}
        />
    </>
}