import {useSelector} from "react-redux";
import {getUrlParams} from "../../store/shared/urlSelector";

const globals = {
    initialized: false,
    lastQuery: "",
    lastNavKey: ""
};

export const getRouteParams = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const searchParams = Object.fromEntries(urlSearchParams);
    console.log("search params", searchParams);
    const pathParts = window.location.pathname.split('/');

    if (pathParts[1] === 'sitemap') return {
        p: 'sitemap',
    }

    if (pathParts[2] === 'card') return {
        p: 'card',
        c: pathParts[4],
    }

    // Search Page
    const params = {
        p: 'search',
        by: searchParams.by,
        bsnf: searchParams.bsnf,
        sq: searchParams.sq,
        lf: searchParams.lf,
        rf: searchParams.rf,
        sf: searchParams.sf,
    };
    //TODO: 1. Figure out if path parts situations, response, servicename or by are in the path


    return params;

    // let key, value;
    // const pathParams = decodeURI(window.location.pathname).split("/");
    // if (pathParams[0] === '') pathParams.shift(); // Remove leading empty element
    // while (pathParams.length > 1) {
    //     key = pathParams.shift();
    //     value = pathParams.shift();
    //     if (!key) continue;
    //     params[key as string] = decodeURIComponent(value || '');
    // }
    // if (params.sq) {
    //     params.sq = params.sq.split('&')[0];
    // }
    // return params
};

const buildUrl = (params: Record<string, string>) => {
    const base = `${window.location.protocol}//${window.location.host}`;
    const hash = window.location.hash;
    const routeParams = {...params};
    if (!routeParams.p) return base + hash;
    if (routeParams.p === 'sitemap') return `${base}/sitemap${hash}`
    if (routeParams.p === 'card' && routeParams.c) return `${base}/p/card/c/${routeParams.c}${hash}`;

    const categories = [];
    if (routeParams.bsf) categories.push(routeParams.bsf);
    if (routeParams.brf) categories.push(routeParams.brf);
    if (routeParams.by && categories.length < 2) {
        categories.push(`by|${routeParams.by}`);
        delete routeParams.by;
    }
    if (routeParams.bsnf && categories.length < 2) {
        categories.push(`bsnf|${routeParams.bsnf}`);
        delete routeParams.bsnf;
    }
    const category = categories.join('/');

    delete routeParams.p;
    delete routeParams.c;
    delete routeParams.bsf;
    delete routeParams.brf;
    const queryString = new URLSearchParams(routeParams).toString();

    return `${base}/${category}?${queryString}`;
};

const navKey = (params: Record<string, string>) => {
    const p = params.p || 'home';
    if (p === 'card') return `card|${params.c || ''}`;
    return p + '|';
};

const applyHistory = (params: Record<string, string>) => {
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

export const useGetCurrentRoute = () => {
    const params = useSelector(getUrlParams) as Record<string, string>;
    return buildUrl(params);

}

export const useRouteUpdater = () => {
    const params = useSelector(getUrlParams) as Record<string, string>;
    applyHistory(params);
};
