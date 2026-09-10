import { Show, UserButton } from "@clerk/react";
import { Box, Drawer, Flex, IconButton, Text, useMediaQuery } from "@chakra-ui/react";
import { Menu } from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../LoginForm";
import { SimpleDialog } from "../ui/SimpleDialog";
import { NAVBAR_BREAK } from "@/constants/Media";

const NAV_ITEMS = [
    { label: "Recipe Box",   path: "/recipes" },
    { label: "Bounties",     path: "/bounties" },
    { label: "DnD",          path: "/dnd" },
    { label: "About",        path: "/about" },
    { label: "Split Check",  path: "/split-check" },
    { label: "Login",        path: "/login" },
];

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [isMobile] = useMediaQuery([`(max-width: ${NAVBAR_BREAK})`], { fallback: [false] });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

    const isActive = (path: string) => pathname.startsWith(path);

    const handleNav = (path: string) => {
        if (!isMobile && path === "/login") {
            setLoginOpen(true);
        } else {
            navigate(path);
        }
    };

    return (
        <Flex
            as="nav"
            position="sticky"
            top="0"
            zIndex="10"
            bg="bg.raised"
            borderBottom="1px solid"
            borderBottomColor="border.DEFAULT"
            h="var(--fp-nav-height)"
            px="6"
            gap="6"
            align="center"
            boxShadow="xs"
        >
            {/* Brand */}
            <Flex
                as="button"
                align="center"
                gap="2"
                bg="transparent"
                border="none"
                cursor="pointer"
                onClick={() => navigate("/")}
                fontFamily="display"
                fontSize="lg"
                fontWeight="500"
                color="fg.DEFAULT"
                p="0"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80, "WONK" 1' }}
            >
                <img src="/mtn.png" alt="" style={{ width: 24, height: 24 }} />
                <Text>Fargopolis</Text>
            </Flex>

            {isMobile ? (
                <>
                    <Flex ml="auto" align="center" gap="2">
                        <Show when="signed-in"><UserButton /></Show>
                        <IconButton variant="ghost" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
                            <Menu />
                        </IconButton>
                    </Flex>

                    <Drawer.Root
                        open={drawerOpen}
                        onOpenChange={(e) => setDrawerOpen(e.open)}
                        placement="end"
                        lazyMount
                        unmountOnExit
                    >
                        <Drawer.Backdrop />
                        <Drawer.Positioner>
                            <Drawer.Content bg="bg.raised" maxW="220px">
                                <Drawer.CloseTrigger />
                                <Drawer.Body pt="8" px="0">
                                    {NAV_ITEMS.map((item) => (
                                        <Box
                                            key={item.path}
                                            as="button"
                                            w="full"
                                            textAlign="left"
                                            px="5"
                                            py="3"
                                            bg="transparent"
                                            border="none"
                                            cursor="pointer"
                                            fontFamily="body"
                                            fontWeight={isActive(item.path) ? "600" : "400"}
                                            color={isActive(item.path) ? "brand.DEFAULT" : "fg.secondary"}
                                            _hover={{ color: "fg.DEFAULT", bg: "bg.sunk" }}
                                            onClick={() => {
                                                setDrawerOpen(false);
                                                handleNav(item.path);
                                            }}
                                        >
                                            {item.label}
                                        </Box>
                                    ))}
                                </Drawer.Body>
                            </Drawer.Content>
                        </Drawer.Positioner>
                    </Drawer.Root>
                </>
            ) : (
                <>
                    <Flex ml="auto" gap="0.5" align="center">
                        {NAV_ITEMS.map((item) => (
                            <Box
                                key={item.path}
                                as="button"
                                bg="transparent"
                                border="none"
                                borderBottom="2px solid"
                                borderBottomColor={isActive(item.path) ? "ember.500" : "transparent"}
                                color={isActive(item.path) ? "brand.DEFAULT" : "fg.secondary"}
                                fontFamily="body"
                                fontSize="xs"
                                fontWeight="500"
                                letterSpacing="0.02em"
                                px="3"
                                h="var(--fp-nav-height)"
                                whiteSpace="nowrap"
                                cursor="pointer"
                                transition="color 200ms"
                                _hover={{ color: "fg.DEFAULT" }}
                                onClick={() => handleNav(item.path)}
                            >
                                {item.label}
                            </Box>
                        ))}
                    </Flex>
                    <Show when="signed-in"><UserButton /></Show>
                    <Show when="signed-out">
                        <Flex
                            w="8"
                            h="8"
                            borderRadius="full"
                            bg="pine.500"
                            color="white"
                            align="center"
                            justify="center"
                            fontFamily="mono"
                            fontSize="xs"
                            fontWeight="600"
                            flexShrink="0"
                        >
                            AK
                        </Flex>
                    </Show>
                </>
            )}

            <SimpleDialog isOpen={loginOpen} onClose={() => setLoginOpen(false)} maxWidth="md">
                <LoginForm onLogin={() => setLoginOpen(false)} />
            </SimpleDialog>
        </Flex>
    );
};

export default Navbar;
