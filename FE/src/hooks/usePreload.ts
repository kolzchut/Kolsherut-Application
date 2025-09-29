import {useEffect} from "react";

type PreloadParams = {
    href: string,
    as?: string,
    fetchPriority?: "high" | "low" | "auto"
};

export function usePreload({href, as = "image", fetchPriority = "auto"}: PreloadParams) {
    useEffect(() => {
        if (!href) return;

        const link = document.createElement("link");
        link.rel = "preload";
        link.as = as;
        link.href = href;
        link.fetchPriority = fetchPriority;

        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, [href, as, fetchPriority]);
}
