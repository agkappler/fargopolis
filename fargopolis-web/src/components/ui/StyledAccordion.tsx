import { Accordion, Box, Text } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode } from "react";

interface StyledAccordionProps extends PropsWithChildren {
    title: string;
    /** Optional right-side summary in the header (e.g. "3 proficient"). */
    summary?: ReactNode;
}

export const StyledAccordion: React.FC<StyledAccordionProps> = ({ title, summary, children }) => {
    return (
        <Accordion.Root collapsible mb="2" borderRadius="md">
            <Accordion.Item value={title}>
                <Accordion.ItemTrigger cursor="pointer" minH="44px" gap="3">
                    <Text flex="1" fontFamily="display" fontSize="md">{title}</Text>
                    {summary != null && summary !== false && (
                        <Box flexShrink="0" display="flex" gap="2" alignItems="center" color="fg.muted" fontSize="xs">
                            {summary}
                        </Box>
                    )}
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
