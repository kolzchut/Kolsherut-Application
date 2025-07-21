import {useState} from "react";

export const useOnce = (cb: (params)=>void) => {
    const [hasRun, setHasRun] = useState(false);
    return (...params) => {
        if(hasRun) return;
        setHasRun(true);
        cb(...params)
    }
}
