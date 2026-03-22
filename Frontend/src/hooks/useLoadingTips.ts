import { useState, useEffect } from 'react';

const TIPS = [
    "Did you know? Soil testing can save 20% on fertilizers.",
    "Tip: Rotate crops to naturally prevent soil depletion.",
    "Tip: Use neem oil to naturally repel pests without chemicals.",
    "Tip: Drip irrigation saves water and reduces weed growth.",
    "Did you know? CropCycle maps your year to maximize profit.",
    "Tip: Consider multi-cropping to increase overall yield and reduce risk.",
    "Did you know? Organic mulching retains soil moisture by up to 30%.",
    "Tip: Timely pruning of orchard trees improves sunlight penetration and fruit quality.",
    "Tip: Planting marigolds near tomatoes naturally deters nematodes and other pests.",
    "Did you know? Biochar can improve soil fertility and sequester carbon for hundreds of years.",
    "Tip: Implement rainwater harvesting to secure water supply during dry spells.",
    "Tip: Earthworms are a farmer's best friend. Encourage them by avoiding deep tillage.",
    "Did you know? Legumes fix nitrogen in the soil, reducing the need for synthetic nitrogen fertilizers.",
    "Tip: Regularly clean farming equipment to prevent the spread of soil-borne diseases.",
    "Tip: Planting windbreaks reduces soil erosion and protects delicate crops from harsh winds.",
    "Did you know? Precision agriculture uses technology to ensure crops and soil receive exactly what they need.",
    "Tip: Always test seed germination rates before mass planting to ensure a good yield.",
    "Tip: Storing harvested crops at the right temperature and humidity minimizes post-harvest losses.",
    "Did you know? Companion planting can enhance growth and protect plants from pests naturally.",
    "Tip: Keep detailed records of crop yields and inputs to make better data-driven decisions next season."
];

export const useLoadingTips = (isLoading: boolean, intervalMs: number = 10000) => {
    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            interval = setInterval(() => {
                setTipIndex((prev) => (prev + 1) % TIPS.length);
            }, intervalMs);
        }
        return () => clearInterval(interval);
    }, [isLoading, intervalMs]);

    return TIPS[tipIndex];
};
