import { Box, Flex, Text } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps extends PropsWithChildren {
    title?: string;
    eyebrow?: string;
    back?: { label?: string; url?: string };
    /** @deprecated Use back prop instead */
    leftContainer?: ReactNode;
    rightContainer?: ReactNode;
    headerColor?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    eyebrow,
    back,
    leftContainer,
    rightContainer,
    children,
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (back?.url) navigate(back.url);
        else navigate(-1);
    };

    const hasNav = back || leftContainer;

    return (
        <Box
            as="header"
            position="relative"
            bg="bg.sunk"
            borderBottom="1px solid"
            borderBottomColor="border"
        >
            <Box
                maxW="fp.container"
                mx="auto"
                px="6"
                pt="4"
                pb="5"
                display="grid"
                gridTemplateColumns={{ base: "1fr", sm: "1fr auto" }}
                gridTemplateRows="auto auto"
                gap="1"
                alignItems="end"
            >
                {hasNav && (
                    <Flex
                        gridColumn="1 / -1"
                        align="center"
                        gap="2"
                        textStyle="label"
                        color="fg.muted"
                        mb="1"
                    >
                        {back ? (
                            <>
                                <Box
                                    as="button"
                                    bg="transparent"
                                    border="none"
                                    cursor="pointer"
                                    color="brand"
                                    p="0"
                                    _hover={{ color: "accent.hover" }}
                                    transition="color 200ms"
                                    onClick={handleBack}
                                >
                                    ‹ {back.label ?? "Back"}
                                </Box>
                                <Text color="stone.200">/</Text>
                            </>
                        ) : (
                            leftContainer
                        )}
                        {title && <Text color="fg">{title}</Text>}
                    </Flex>
                )}

                <Flex direction="column" gap="1">
                    {eyebrow && (
                        <Text textStyle="eyebrow" color="accent">
                            {eyebrow}
                        </Text>
                    )}
                    {title && (
                        <Text
                            as="h1"
                            m="0"
                            textStyle="display-title"
                            fontSize={{ base: "2xl", sm: "3xl" }}
                            letterSpacing="-0.02em"
                            color="fg"
                            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80, "WONK" 1' }}
                        >
                            {title}
                        </Text>
                    )}
                    {children}
                </Flex>

                {rightContainer && (
                    <Flex align="center" gap="2" justifySelf="end" alignSelf="center">
                        {rightContainer}
                    </Flex>
                )}
            </Box>

            {/* Ember rule */}
            <Box
                position="absolute"
                left="0"
                right="0"
                bottom="-1px"
                h="2px"
                style={{ backgroundImage: `linear-gradient(to right, #c25a30 0, #c25a30 56px, transparent 56px)` }}
                aria-hidden="true"
            />
        </Box>
    );
};
