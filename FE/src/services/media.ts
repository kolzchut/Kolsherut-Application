import {widthOfMobile} from "../constants/mediaQueryProps";

export const isMobileScreen = () => window.matchMedia(`(max-width: ${widthOfMobile}px)`).matches;
