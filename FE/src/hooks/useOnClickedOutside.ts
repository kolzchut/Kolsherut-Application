import {useEffect, useRef } from 'react';

export default (onClickOutside: ()=>void, onlyIfWasActive = false) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const lastSelected = useRef(false);

    const handleClickOutside = (event: Event) => {
        const outOfThisElement = !onlyIfWasActive || lastSelected.current;

        if (ref.current && outOfThisElement &&!ref.current.contains(event.target as Node)) {
            onClickOutside();
        }
        lastSelected.current = ref.current === document.activeElement;
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () =>  document.removeEventListener('click', handleClickOutside, true);
    }, []);

    return { ref };
}
