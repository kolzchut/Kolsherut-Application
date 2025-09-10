import {useSelector} from "react-redux";
import {getUrlParams} from "../../store/shared/urlSelector";

const globals = {
    initialized: false,
    lastQuery: "",
    lastNavKey: ""
};

export const getRouteParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(searchParams);
};

const buildUrl = (params: Record<string,string>) => {
    const qs = new URLSearchParams(params).toString();
    const base = window.location.pathname;
    const hash = window.location.hash;
    return qs ? base + "?" + qs + hash : base + hash;
};

const navKey = (params: Record<string,string>) => {
    const p = params.p || 'home';
    if (p === 'card') return `card|${params.c || ''}`;
    return p + '|';
};

const applyHistory = (params: Record<string,string>) => {
    const qs = new URLSearchParams(params).toString();
    const key = navKey(params);
    const suppress = window.__suppressHistoryPush;

    if (!globals.initialized) {
        // Initial sync: never push, just replace
        window.history.replaceState(params, "", buildUrl(params));
        globals.initialized = true;
        globals.lastQuery = qs;
        globals.lastNavKey = key;
        return;
    }

    // If hydration suppression is active, just record and exit
    if (suppress) {
        globals.lastQuery = qs;
        globals.lastNavKey = key;
        return;
    }

    if (qs === globals.lastQuery) return;

    const url = buildUrl(params);
    if (key !== globals.lastNavKey) {
        window.history.pushState(params, "", url);
    } else {
        window.history.replaceState(params, "", url);
    }
    globals.lastQuery = qs;
    globals.lastNavKey = key;
};

export const useRouteUpdater = () => {
    const params = useSelector(getUrlParams) as Record<string,string>;
    applyHistory(params);
};
