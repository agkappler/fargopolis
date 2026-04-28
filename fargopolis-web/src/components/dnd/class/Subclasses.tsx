import { BaseDndResponse, getSubclasses } from "@/api/dnd5eapi";
import RequestManager from "@/helpers/RequestManager";
import Subclass from "@/models/Subclass";
import { useAuth } from "@clerk/react";
import { Add, Build, Edit } from "@mui/icons-material";
import { Box, Grid, MenuItem, Select, Typography } from "@mui/material";
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
        () => RequestManager.getGateway<Subclass[]>(`/subclasses/class/${classIndex}`),
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
            icon: <Add />,
            onClick: () => setIsSubclassFormOpen(true)
        },
        ...(isCustom ? [
            {
                label: "Edit Subclass",
                icon: <Edit />,
                onClick: () => setIsSubclassFormOpen(true)
            },
            {
                label: "Manage Features",
                icon: <Build />,
                onClick: () => setIsFeaturesFormOpen(true)
            }
        ] : [])
    ];

    return <>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomSubclasses}>
            <Grid container>
                <Grid size={2}></Grid>
                <Grid size={8}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
                        <Typography variant="h6" textAlign="center">Subclass Info:</Typography>
                        <Select
                            value={selectedSubclass}
                            onChange={(e) => handleSubclassChange(e.target.value as string)}
                        >
                            {subclasses.map((c, index) => (
                                <MenuItem key={index} value={c.index}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Grid>
                <Grid size={2} className="flex justify-end">
                    {isLoaded && isSignedIn && (
                        <ActionMenu
                            options={menuOptions}
                            ariaLabel="Subclass options"
                        />
                    )}
                </Grid>
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