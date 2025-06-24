import home from "./home/home";
import card from "./card/card";

const pages = {
    home: home,
    card: card,
};

export default pages;

export const pageKeys = Object.keys(pages) as Array<keyof typeof pages>;

export type Pages = keyof typeof pages;
