import {useSelector} from "react-redux";
import {getUrlParams} from "../../store/shared/urlSelector";
import {debounced} from "../debounced";

const globals = {
    lockUpdateURL: false,
}

export const getRouteParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(searchParams);
}

const updateHistory = (urlParams: Record<string, string>) => {
    const urlParamString = new URLSearchParams(urlParams).toString();
    window.history.pushState(urlParams, "", "?" + urlParamString);
}

const debouncedHistoryUpdate = debounced(updateHistory, 100);

export const useRouteUpdater = () => {
    const urlParams = useSelector(getUrlParams);
    if (globals.lockUpdateURL) return;
    debouncedHistoryUpdate(urlParams);
};
export const setLockUpdateURL = (lock: boolean) => globals.lockUpdateURL = lock;
