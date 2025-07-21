import {useState} from "react";

export const useDebounce = (cb: (args:unknown) => void, delay: number) => {
    const [prev, setPrev] = useState(0);
    return (...args) => {
        clearTimeout(prev);
        const timeoutId = setTimeout(()=>{cb(...args)},delay);
        setPrev(timeoutId);
    }
}
