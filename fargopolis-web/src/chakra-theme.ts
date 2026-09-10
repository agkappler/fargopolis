import {
    createSystem,
    defaultConfig,
    defineConfig,
    defineRecipe,
    defineSlotRecipe,
} from "@chakra-ui/react";

// ---- Component recipes -----------------------------------------------

/** StatusChip — semantic dot + pill. Used via <Badge status="success"> */
const badgeRecipe = defineRecipe({
    base: {
        fontFamily: "mono",
        fontSize: "2xs",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        px: "2.5",
        py: "1",
        borderRadius: "full",
        border: "1px solid",
        display: "inline-flex",
        alignItems: "center",
        gap: "1.5",
        width: "fit-content",
    },
    variants: {
        status: {
            success: { color: "#2c4a3a", borderColor: "#4a6e54", bg: "#e6ede0" },
            info:    { color: "#364856", borderColor: "#4a5d6a", bg: "#e2e7eb" },
            warning: { color: "#6b4910", borderColor: "#c79234", bg: "#f6e8c8" },
            error:   { color: "#6b1e15", borderColor: "#b03a2e", bg: "#f4d6d2" },
        },
    },
    defaultVariants: { status: "info" },
});

/** ModelCard — warm parchment card with pine top rule → ember on hover */
const cardSlotRecipe = defineSlotRecipe({
    slots: ["root", "header", "body", "footer"],
    base: {
        root: {
            bg: "bg.raised",
            border: "1px solid",
            borderColor: "border.DEFAULT",
            borderTopWidth: "2px",
            borderTopColor: "pine.500",
            borderRadius: "md",
            boxShadow: "sm",
            display: "flex",
            flexDir: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "2",
            h: "full",
            transition: "all 200ms",
            _hover: {
                boxShadow: "md",
                transform: "translateY(-1px)",
                borderTopColor: "ember.500",
            },
            p: "4",
        },
        header: {
            p: "0",
            mb: "1",
        },
        body: {
            p: "0",
            flex: "1",
            display: "flex",
            flexDir: "column",
            alignItems: "center",
            gap: "2",
            w: "full",
        },
        footer: {
            p: "0",
            mt: "auto",
            pt: "2",
        },
    },
});

/** AddModelCard button variant — dashed pine border → ember on hover */
const buttonRecipe = defineRecipe({
    base: {
        fontFamily: "body",
        fontWeight: "500",
        borderRadius: "md",
        transition: "all 200ms",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "1.5",
        _focusVisible: {
            outline: "2px solid",
            outlineColor: "ember.500",
            outlineOffset: "2px",
        },
        _active: { transform: "scale(0.98)" },
    },
    variants: {
        variant: {
            primary: {
                bg: "pine.700",
                color: "white",
                border: "1px solid transparent",
                boxShadow: "sm",
                px: "4",
                py: "2",
                fontSize: "sm",
                _hover: { bg: "pine.900", boxShadow: "md" },
            },
            secondary: {
                bg: "bg.raised",
                color: "ember.700",
                border: "1px solid",
                borderColor: "ember.500",
                px: "4",
                py: "2",
                fontSize: "sm",
                _hover: { bg: "ember.100" },
            },
            ghost: {
                bg: "transparent",
                color: "pine.700",
                border: "none",
                px: "2.5",
                py: "2",
                fontSize: "sm",
                _hover: { color: "ember.700" },
            },
            addCard: {
                w: "full",
                h: "full",
                minH: "132px",
                border: "1.5px dashed",
                borderColor: "pine.500",
                bg: "bg.raised",
                color: "pine.700",
                boxShadow: "sm",
                justifyContent: "center",
                fontSize: "sm",
                flexDir: "column",
                gap: "2",
                _hover: {
                    boxShadow: "md",
                    bg: "bg.raised",
                    borderColor: "ember.500",
                    color: "ember.700",
                },
            },
        },
    },
    defaultVariants: { variant: "primary" },
});

// ---- Full system config -----------------------------------------------

const config = defineConfig({
    theme: {
        tokens: {
            colors: {
                ink: {
                    900: { value: "#1c1a17" },
                    800: { value: "#2a2620" },
                    700: { value: "#3a352c" },
                    600: { value: "#564e42" },
                    500: { value: "#6f6658" },
                },
                stone: {
                    400: { value: "#8a847b" },
                    300: { value: "#a8a297" },
                    200: { value: "#c5beb1" },
                    100: { value: "#ddd6c8" },
                    50:  { value: "#ece5d4" },
                },
                parchment: {
                    100: { value: "#f4ede0" },
                    50:  { value: "#faf6ed" },
                    0:   { value: "#fdfbf6" },
                },
                pine: {
                    900: { value: "#1f3328" },
                    700: { value: "#2c4a3a" },
                    500: { value: "#4a6e54" },
                    300: { value: "#7a9a7e" },
                    100: { value: "#d3dccd" },
                },
                ember: {
                    900: { value: "#6b321a" },
                    700: { value: "#a04a26" },
                    500: { value: "#c25a30" },
                    400: { value: "#d97a4a" },
                    200: { value: "#e9b594" },
                    100: { value: "#f4d8c4" },
                },
                slate: {
                    700: { value: "#364856" },
                    500: { value: "#4a5d6a" },
                    300: { value: "#7a8b96" },
                },
            },
            fonts: {
                display: { value: '"Fraunces", "Iowan Old Style", Georgia, serif' },
                body:    { value: '"Inter", "Helvetica Neue", system-ui, sans-serif' },
                mono:    { value: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' },
            },
            fontSizes: {
                "2xs": { value: "12px" },
                xs:    { value: "14px" },
                sm:    { value: "16px" },
                md:    { value: "18px" },
                lg:    { value: "22px" },
                xl:    { value: "28px" },
                "2xl": { value: "36px" },
                "3xl": { value: "48px" },
                "4xl": { value: "64px" },
            },
            radii: {
                sm:   { value: "2px" },
                md:   { value: "4px" },
                lg:   { value: "8px" },
                xl:   { value: "12px" },
                full: { value: "9999px" },
            },
            shadows: {
                xs: { value: "0 1px 0 rgba(28,26,23,0.06)" },
                sm: { value: "0 1px 2px rgba(28,26,23,0.08), 0 1px 0 rgba(28,26,23,0.04)" },
                md: { value: "0 2px 4px rgba(28,26,23,0.10), 0 4px 12px rgba(28,26,23,0.06)" },
                lg: { value: "0 6px 16px rgba(28,26,23,0.12), 0 2px 4px rgba(28,26,23,0.06)" },
            },
            durations: {
                fast:   { value: "120ms" },
                normal: { value: "200ms" },
                slow:   { value: "320ms" },
            },
        },
        semanticTokens: {
            colors: {
                bg: {
                    DEFAULT: { value: "{colors.parchment.50}" },
                    raised:  { value: "{colors.parchment.0}" },
                    sunk:    { value: "{colors.parchment.100}" },
                    inverse: { value: "{colors.ink.900}" },
                },
                fg: {
                    DEFAULT:   { value: "{colors.ink.900}" },
                    secondary: { value: "{colors.ink.700}" },
                    muted:     { value: "{colors.ink.500}" },
                    subtle:    { value: "{colors.stone.400}" },
                    onDark:    { value: "{colors.parchment.50}" },
                },
                border: {
                    DEFAULT: { value: "rgba(28, 26, 23, 0.14)" },
                    strong:  { value: "rgba(28, 26, 23, 0.28)" },
                    soft:    { value: "rgba(28, 26, 23, 0.06)" },
                },
                accent: {
                    DEFAULT: { value: "{colors.ember.500}" },
                    hover:   { value: "{colors.ember.700}" },
                },
                brand: {
                    DEFAULT: { value: "{colors.pine.700}" },
                    hover:   { value: "{colors.pine.900}" },
                },
            },
        },
        textStyles: {
            /** Mono uppercase label — nav metadata, chips, category tags */
            label: {
                value: {
                    fontFamily: "mono",
                    fontSize: "2xs",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                },
            },
            /** Eyebrow above a hero title */
            eyebrow: {
                value: {
                    fontFamily: "mono",
                    fontSize: "2xs",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                },
            },
            /** Display / Fraunces heading — pair with fontSize override per context */
            "display-title": {
                value: {
                    fontFamily: "display",
                    fontWeight: "500",
                    lineHeight: "1.1",
                },
            },
        },
        recipes: {
            badge:  badgeRecipe,
            button: buttonRecipe,
        },
        slotRecipes: {
            card: cardSlotRecipe,
        },
    },
    globalCss: {
        body: {
            bg: "bg.DEFAULT",
            color: "fg.DEFAULT",
            fontFamily: "body",
            margin: "0",
        },
        "#root": {
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
        },
    },
});

export const chakraSystem = createSystem(defaultConfig, config);

// Named export required by the Chakra CLI typegen command (`chakra-ui typegen`).
export const system = chakraSystem;
