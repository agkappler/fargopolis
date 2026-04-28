import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { PropsWithChildren } from "react";

interface StyledAccordionProps extends PropsWithChildren {
    title: string;
}

export const StyledAccordion: React.FC<StyledAccordionProps> = ({ title, children }) => {
    return (
        <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};
