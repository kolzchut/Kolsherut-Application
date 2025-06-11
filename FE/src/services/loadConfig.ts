import axios from 'axios';

declare global {
    interface Window {
        config: any;
        strings: any;
    }
}

const configUrl = `/config.json?cacheBuster=${Date.now()}`;
const stringsUrl = `/strings.json?cacheBuster=${Date.now()}`;

export  default async () => {
    const promises = await Promise.all([
        axios.get(configUrl),
        axios.get(stringsUrl),
    ]);

    window.config = promises[0].data;
    window.strings = promises[1].data;
    Object.freeze(window.config);
    Object.freeze(window.strings);
};