import {widthOfMobile} from "../constants/mediaQueryProps.ts";

export const isMobileScreen = ()=> window.screen.width <= widthOfMobile;
