import { Typography } from "@mui/material"

export const DescriptionList: React.FC<{ descriptions: string[] }> = ({ descriptions }) => {
    return descriptions.map((description, index) => (
        <Typography key={index} variant="body1" textAlign="center">{description}</Typography>
    ));
}