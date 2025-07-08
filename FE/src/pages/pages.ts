import home from "./home/home";
import card from "./card/card";
import maintenance from "./maintanence/maintenance";
import resultsWithContext from "./results/context/resultsWithContext";

const pages = {
    home,
    card,
    results: resultsWithContext,
    maintenance,
};

export default pages;

export const pageKeys = Object.keys(pages) as Array<keyof typeof pages>;

export type Pages = keyof typeof pages;
