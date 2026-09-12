import { useFileUrl } from "@/helpers/useFileMetadata";
import Campsite from "@/models/Campsite";
import { Badge, Box, Flex, Text } from "@chakra-ui/react";
import { Mountain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModelCard } from "../ui/ModelCard";
import { formatTravelTime } from "./helpers/travelTime";

interface CampsiteCardProps {
    campsite: Campsite;
}

function formatMonthYear(iso: string | null | undefined): string {
    if (!iso) return "";
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export const CampsiteCard: React.FC<CampsiteCardProps> = ({ campsite }) => {
    const navigate = useNavigate();
    const driveTime = formatTravelTime(campsite.travelTimeMinutes);
    const lastVisit = formatMonthYear(campsite.lastVisitDate);
    const visitCount = campsite.visitCount ?? 0;
    const { url: coverUrl } = useFileUrl(campsite.coverPhotoId);

    return (
        <ModelCard
            borderRadius="sm"
            p="0"
            gap="0"
            overflow="hidden"
            onClick={() => navigate(`/camping/${campsite.campsiteId}`)}
        >
            <Box aspectRatio={16 / 9} w="full" bg="bg.sunk" flexShrink="0">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={campsite.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <Flex align="center" justify="center" h="full" color="fg.subtle">
                        <Mountain size={32} />
                    </Flex>
                )}
            </Box>

            <Flex direction="column" flex="1" px="5" py="4">
                <Text as="h3" m="0" mb="1" textStyle="display-title" fontSize="lg" color="fg">
                    {campsite.name}
                </Text>
                {(campsite.region || campsite.park) && (
                    <Text textStyle="label" color="fg.muted" mb="3">
                        {[campsite.region, campsite.park].filter(Boolean).join(" · ")}
                    </Text>
                )}

                <Flex
                    mt="auto"
                    pt="3"
                    borderTop="1px dashed"
                    borderTopColor="border"
                    gap="2"
                    textStyle="label"
                    color="fg.muted"
                    flexWrap="wrap"
                >
                    {driveTime && <Badge size="xs">{driveTime} away</Badge>}
                    {campsite.firepit === true && <Badge size="xs">Firepit</Badge>}
                    {campsite.views != null && <Badge size="xs">Views {campsite.views}/5</Badge>}
                    {campsite.privacy != null && <Badge size="xs">Privacy {campsite.privacy}/5</Badge>}
                    {visitCount > 0 && (
                        <Badge size="xs">
                            {visitCount} {visitCount === 1 ? "stay" : "stays"}
                            {lastVisit ? ` · last ${lastVisit}` : ""}
                        </Badge>
                    )}
                </Flex>
            </Flex>
        </ModelCard>
    );
};
