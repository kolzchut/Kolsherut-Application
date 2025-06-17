import axios from 'axios';

declare global {
    interface Window {
        config: any;
        strings: any;
        bearer?: any;
    }
}

const configUrl = `/config.json?cacheBuster=${Date.now()}`;
const stringsUrl = `/strings.json?cacheBuster=${Date.now()}`;

export default async () => {
    try {
        const promises = await Promise.all([
            axios.get(configUrl),
            axios.get(stringsUrl),
        ]);

        window.config = promises[0].data;
        window.strings = promises[1].data;


        // 🔒 Ensure config is an object
        if (typeof window.config === "string") {
            try {
                window.config = JSON.parse(window.config);
            } catch (err) {
                console.error("Failed to parse window.config from string:", err);
                window.config = {}; // fallback
            }
        }

        // 🔒 Ensure strings is an object
        if (typeof window.strings === "string") {
            try {
                window.strings = JSON.parse(window.strings);
            } catch (err) {
                console.error("Failed to parse window.strings from string:", err);
                window.strings = {}; // fallback
            }
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error({ message: "Axios error loading config or strings", payload: error });
        } else {
            console.error({ message: "Unexpected error loading config or strings", payload: error });
        }
    }
    finally {
        Object.freeze(window.config);
        Object.freeze(window.strings);
    }
};
