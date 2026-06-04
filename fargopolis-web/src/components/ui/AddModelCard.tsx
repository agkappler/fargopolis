import { Box, Text } from "@chakra-ui/react";

interface AddModelCardProps {
    onClick: () => void;
    title: string;
}

export const AddModelCard: React.FC<AddModelCardProps> = ({ onClick, title }) => {
    return (
        <Box
            as="button"
            w="full"
            h="full"
            border="2px dashed"
            borderColor="border.strong"
            borderRadius="md"
            bg="transparent"
            color="brand.DEFAULT"
            textStyle="label"
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            gap="2"
            transition="all 200ms"
            _hover={{ borderColor: "ember.500", color: "accent.hover", transform: "translateY(-2px)" }}
            onClick={onClick}
        >
            <Text fontSize="xl" lineHeight="1">+</Text>
            <Text>{title}</Text>
        </Box>
    );
};
