import { NAVBAR_BREAK } from "@/constants/Media";
import { Show, UserButton } from "@clerk/react";
import { Menu } from "@mui/icons-material";
import { Box, Button, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Tab, Tabs, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../LoginForm";
import { SimpleDialog } from "../ui/SimpleDialog";

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isMobile = useMediaQuery(`(max-width:${NAVBAR_BREAK})`);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { label: "Recipes", path: "/recipes" },
        { label: "Bounties", path: "/bounties" },
        { label: "DnD", path: "/dnd" },
        { label: "About", path: "/about" },
        { label: "Split Check", path: "/split-check" },
        { label: "Login", path: "/login" },
    ];

    const getTabValue = () => {
        if (pathname.startsWith("/recipes")) return 0;
        if (pathname.startsWith("/bounties")) return 1;
        if (pathname.startsWith("/dnd")) return 2;
        if (pathname.startsWith("/about")) return 3;
        if (pathname.startsWith("/split-check")) return 4;
        if (pathname.startsWith("/login")) return 5;
        return false;
    };

    const handleTabClick = (path: string) => {
        if (!isMobile && path === "/login") {
            setIsOpen(true);
        } else {
            navigate(path);
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-10">
            <Box className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Button
                    variant="text"
                    onClick={() => navigate("/")}
                    startIcon={<img src="/mtn.png" alt="" width={25} height={25} />}
                >
                    Fargopolis
                </Button>
                {isMobile ? (
                    <>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Show when="signed-in">
                                <UserButton />
                            </Show>
                            <IconButton onClick={() => setDrawerOpen(true)} size="large">
                                <Menu />
                            </IconButton>
                        </Box>
                        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                            <Box sx={{ width: 200 }} role="presentation" onClick={() => setDrawerOpen(false)}>
                                <List>
                                    {navItems.map((item) => (
                                        <ListItem key={item.label} disablePadding>
                                            <ListItemButton onClick={() => handleTabClick(item.path)}>
                                                <ListItemText primary={item.label} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Drawer>
                    </>
                ) : (
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
                        <Tabs value={getTabValue()} style={{ display: "flex", flexWrap: "wrap" }} textColor="primary" indicatorColor="primary">
                            {navItems.map((item) => (
                                <Tab key={item.label} label={item.label} onClick={() => handleTabClick(item.path)} />
                            ))}
                        </Tabs>

                        <Show when="signed-in">
                            <UserButton />
                        </Show>
                    </Box>
                )}
            </Box>
            <SimpleDialog isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="md">
                <LoginForm onLogin={() => setIsOpen(false)} />
            </SimpleDialog>
        </nav>
    );
};

export default Navbar;
