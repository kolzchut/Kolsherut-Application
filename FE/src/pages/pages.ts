import home from "./home/home";

const pages = {
    home: home,
};

export default pages;

export type Pages = keyof typeof pages;
