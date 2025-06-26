import axios from 'axios';

declare global {
    interface Window {
        config: any;
        strings: any;
        responseColors:any;
        gtag:any;
    }
}

const configUrl = `/config.json?cacheBuster=${Date.now()}`;
const stringsUrl = `/strings.json?cacheBuster=${Date.now()}`;
const responseColorsUrl = `/responseColors.json?cacheBuster=${Date.now()}`;

export  default async () => {
    const promises = await Promise.all([
        axios.get(configUrl),
        axios.get(stringsUrl),
        axios.get(responseColorsUrl)
    ]);

    window.config = promises[0].data;
    window.strings = promises[1].data;
    window.responseColors = promises[2].data;
    Object.freeze(window.config);
    Object.freeze(window.strings);
    Object.freeze(window.responseColors);
};