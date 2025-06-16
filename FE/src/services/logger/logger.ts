import logToServer from "./logToServer";

export default {
    log: (content: {message: string, payload?: unknown}) => {

        if (window.config.logToServer) logToServer(content)
        console.log(content.message)
        if(content.payload) console.log(content.payload)
    },
    logAlways: (content: {message: string, payload?: unknown}) => {
        if (window.config.logToServer) logToServer(content)
        console.log(content.message)
        if(content.payload) console.log(content.payload)

    },
    warning: (content: { message: string, payload?: unknown }) => {
        if (window.config.logToServer) logToServer(content)
        console.log(content.message)
        if(content.payload) console.log(content.payload)

    },
    error: (content: { message: string, payload?: unknown }) => {
        if (window.config.logToServer) logToServer(content)
        console.log(content.message)
        if(content.payload) console.log(content.payload)

    },
};
