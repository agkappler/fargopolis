import { BaseDndResponse, getClasses } from "@/api/dnd5eapi";
import { ClassFeatures } from "@/components/dnd/class/ClassFeatures";
import { Subclasses } from "@/components/dnd/class/Subclasses";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { DndClass } from "@/constants/DndClass";
import { Plus } from "lucide-react";
import { Box, Button, NativeSelect, Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";

export function DndGlossaryClassesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: apiClassResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>("/classes", () => getClasses());
  const customClasses: { index: string; name: string }[] = [],
    isLoadingCustomClasses = false;
  const classes = [...(apiClassResults?.results ?? []), ...customClasses].sort((a, b) => a.name.localeCompare(b.name));
  const [selectedClass, setSelectedClass] = useState<DndClass>(DndClass.Barbarian);
  const [value, setValue] = useState("1");

  useEffect(() => {
    const classParam = searchParams.get("class");
    if (classParam && classes.length > 0) {
      const classObj = classes.find((c) => c.index === classParam);
      if (classObj) {
        setSelectedClass(classParam as DndClass);
      }
    } else if (classes.length > 0) {
      const firstClass = classes[0];
      setSelectedClass(firstClass.index as DndClass);
    }
  }, [searchParams, classes]);

  const handleClassChange = (classIndex: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("class", classIndex);
    navigate(`/dnd/glossary/classes?${newSearchParams.toString()}`, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="DnD Classes"
        rightContainer={<Button variant="secondary"><Plus size={16} />Add Class</Button>}
        leftContainer={<LinkButton url="/dnd/glossary" label="Glossary" isForward={false} />}
      />
      <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomClasses}>
        <Box display="flex" justifyContent="center">
          <NativeSelect.Root width="auto">
            <NativeSelect.Field value={selectedClass} onChange={(e) => handleClassChange(e.target.value)}>
              {classes.map((c, index) => (
                <option key={index} value={c.index}>
                  {c.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>
        <Tabs.Root value={value} onValueChange={(e) => setValue(e.value)}>
          <Box borderBottomWidth="1px" borderColor="border.DEFAULT" display="flex" justifyContent="center">
            <Tabs.List aria-label="Character info tabs">
              <Tabs.Trigger value="1">Class Info</Tabs.Trigger>
              <Tabs.Trigger value="2">Subclasses</Tabs.Trigger>
            </Tabs.List>
          </Box>
          <Tabs.Content value="1">{selectedClass && <ClassFeatures currentLevel={20} className={selectedClass} />}</Tabs.Content>
          <Tabs.Content value="2">{selectedClass && <Subclasses classIndex={selectedClass} />}</Tabs.Content>
        </Tabs.Root>
      </LoadingWrapper>
    </>
  );
}
