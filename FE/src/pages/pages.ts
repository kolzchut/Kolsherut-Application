import home from "./home/home";

const pages = {
    home: home,
};

export default pages;

export const pageKeys = Object.keys(pages) as Array<keyof typeof pages>;

export type Pages = keyof typeof pages;
