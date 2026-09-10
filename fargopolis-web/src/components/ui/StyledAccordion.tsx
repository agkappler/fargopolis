import { Accordion, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface StyledAccordionProps extends PropsWithChildren {
    title: string;
}

export const StyledAccordion: React.FC<StyledAccordionProps> = ({ title, children }) => {
    return (
        <Accordion.Root collapsible mb="2" borderRadius="md">
            <Accordion.Item value={title}>
                <Accordion.ItemTrigger>
                    <Text flex="1" fontFamily="display" fontSize="md">{title}</Text>
                    <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                    <Accordion.ItemBody>
                        {children}
                    </Accordion.ItemBody>
                </Accordion.ItemContent>
            </Accordion.Item>
        </Accordion.Root>
    );
};
