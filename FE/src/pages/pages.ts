import home from "./home/home";
import card from "./card/card";

const pages = {
    home: home,
    card: card,
};

export default pages;

export type Pages = keyof typeof pages;
