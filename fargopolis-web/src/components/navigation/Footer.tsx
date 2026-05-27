import { Box, Flex, Link, Text } from "@chakra-ui/react";

export const Footer: React.FC = () => {
    return (
        <Flex
            as="footer"
            bg="pine.900"
            color="fg.onDark"
            px="6"
            py="4"
            justify="space-between"
            align="center"
            borderTop="3px solid"
            borderTopColor="ember.500"
            flexWrap="wrap"
            gap="3"
        >
            <Flex align="center" gap="2.5">
                <img src="/mtn.png" alt="" style={{ height: 18, filter: "invert(1)" }} />
                <Text
                    textStyle="display-title"
                    fontSize="sm"
                    color="parchment.50"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80, "WONK" 1' }}
                >
                    Fargopolis
                </Text>
                <Text textStyle="label" color="stone.400">
                    · Built by Alex 'Fargo' Kappler
                </Text>
            </Flex>

            <Flex gap="5" textStyle="label" color="stone.200">
                <Link
                    href="https://www.linkedin.com/in/alex-kappler-952749140/"
                    target="_blank"
                    rel="noopener noreferrer"
                    textDecoration="none"
                    _hover={{ color: "ember.200" }}
                    transition="color 200ms"
                >
                    LinkedIn
                </Link>
                <Link
                    href="https://github.com/agkappler"
                    target="_blank"
                    rel="noopener noreferrer"
                    textDecoration="none"
                    _hover={{ color: "ember.200" }}
                    transition="color 200ms"
                >
                    GitHub
                </Link>
            </Flex>
        </Flex>
    );
};
