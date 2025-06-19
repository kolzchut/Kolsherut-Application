import {useSelector} from "react-redux";
import {getUrlParams} from "../store/general/general.selector";

export const getRouteParams = () =>{
    const searchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(searchParams);
}

export const useRouteUpdater =()=>{
    const urlParams = useSelector(getUrlParams);
    const urlParamString = new URLSearchParams(urlParams).toString();
    window.history.pushState({}, "", "?" + urlParamString);
};
