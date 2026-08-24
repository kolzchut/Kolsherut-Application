import home from "./home/home";
import card from "./card/card";
import maintenance from "./maintanence/maintenance";
import resultsWithContext from "./results/context/resultsWithContext";
import about from "./staticPages/about/about";
import missing from "./staticPages/missing/missing";
import partners from "./staticPages/partners/partners";
import contact from "./staticPages/contact/contact";

// `home` must stay first: getPage falls back to pageKeys[0] for unknown pages.
const pages = {
    home,
    map:home,
    card,
    results: resultsWithContext,
    maintenance,
    about,
    missing,
    partners,
    contact,
};

export default pages;
export const pageKeys = Object.keys(pages) as Array<keyof typeof pages>;

export type Pages = keyof typeof pages;
