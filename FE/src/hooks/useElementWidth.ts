import { useState, useEffect } from 'react';

const useElementWidth = (ref: React.RefObject<HTMLElement | null>)=> {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, [ref]);

    return width;
}

export default useElementWidth;
