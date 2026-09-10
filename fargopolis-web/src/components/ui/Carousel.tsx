import { CAROUSEL_BREAK } from "@/constants/Media";
import { Box, IconButton, SimpleGrid, useMediaQuery } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { surfaceCardProps } from "./surfaceStyle";

interface CarouselProps extends PropsWithChildren {
    cardContents: ReactNode[];
}

export const Carousel: React.FC<CarouselProps> = ({ cardContents }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const handleNext = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % cardContents.length);
    const handlePrev = () => setCurrentIndex((prevIndex) => (prevIndex - 1 + cardContents.length) % cardContents.length);
    const [isMobile] = useMediaQuery([`(max-width: ${CAROUSEL_BREAK})`], { fallback: [false] });

    return (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            {!isMobile
                ? (<>
                    {/* Carousel Section */}
                    <Box
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                        width="100%"
                        paddingX={2}
                    >
                        {/* Back Arrow */}
                        <IconButton variant="ghost" aria-label="Previous" onClick={handlePrev}><ChevronLeft /></IconButton>

                        {/* Carousel Cards */}
                        <Box
                            gap={2}
                            width="100%"
                            height="210px"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            {cardContents.map((project, index) => {
                                const isCurrent = index === currentIndex;
                                const isLeft = index === (currentIndex - 1 + cardContents.length) % cardContents.length;
                                const isRight = index === (currentIndex + 1) % cardContents.length;

                                return (
                                    <Box
                                        key={index}
                                        {...surfaceCardProps}
                                        boxShadow="md"
                                        width="30%"
                                        height="210px"
                                        opacity={isCurrent ? 1 : ((isLeft || isRight) ? 0.75 : 0)}
                                        transform={isCurrent
                                            ? "scale(1)"
                                            : isLeft
                                                ? "translateX(-50%) scale(0.75)"
                                                : "translateX(50%) scale(0.75)"}
                                        transition="all 0.5s ease-in-out, opacity 0.5s ease-in-out, left 0.5s ease-in-out"
                                        position="absolute"
                                        left={isCurrent ? "35%" : isLeft ? "20%" : "50%"}
                                        zIndex={isCurrent ? 3 : (isRight || isLeft) ? 2 : 1}
                                        textAlign="center"
                                        padding={2}
                                        display="flex"
                                        flexDirection="column"
                                        gap={1}
                                        alignItems="center"
                                    >
                                        {project}
                                    </Box>)
                            })}
                        </Box>

                        {/* Forward Arrow */}
                        <IconButton variant="ghost" aria-label="Next" onClick={handleNext}><ChevronRight /></IconButton>
                    </Box>

                    {/* Pagination Indicators */}
                    <Box display="flex" justifyContent="center" gap={1} marginTop={2}>
                        {cardContents.map((_, index) => (
                            <IconButton
                                key={index}
                                variant="ghost"
                                size="sm"
                                aria-label={`Go to slide ${index + 1}`}
                                onClick={() => setCurrentIndex(index)}
                            >
                                <Circle size={12} fill={index === currentIndex ? "currentColor" : "none"} />
                            </IconButton>
                        ))}
                    </Box>
                </>)
                : (
                    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={1} marginX={2}>
                        {cardContents.map((project, index) => (
                            <Box
                                key={index}
                                {...surfaceCardProps}
                                boxShadow="md"
                                textAlign="center"
                                padding={2}
                                display="flex"
                                flexDirection="column"
                                gap={1}
                                alignItems="center"
                                height="100%"
                                justifyContent="space-between"
                            >
                                {project}
                            </Box>
                        ))}
                    </SimpleGrid>
                )
            }
        </Box>
    );
}
