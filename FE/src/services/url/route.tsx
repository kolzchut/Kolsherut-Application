import {useSelector} from "react-redux";
import {getUrlParams} from "../../store/shared/urlSelector";
import UrlParams from "../../types/urlParams";
import matchSubSlugTaxonomy from "../../utilities/matchSubSlugTaxonomy.ts";

const globals = {
    initialized: false,
    lastQuery: "",
    lastNavKey: ""
};

export const getRouteParams = (): UrlParams => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const searchParams = Object.fromEntries(urlSearchParams);
    const pathParts = window.location.pathname.split('/');
    const taxonomy = matchSubSlugTaxonomy(pathParts.slice(1, 3))
    const routeBy = pathParts.find(part => part.startsWith('by-'));
    const routeBsnf = pathParts.find(part => part.startsWith('bsnf-'));

    if (routeBy) searchParams.by = routeBy.replace('by-', '');
    if (routeBsnf) searchParams.bsnf = routeBsnf.replace('bsnf-', '');
    if (pathParts[1] === 'map') return {
        p: 'map',
    }

    if (pathParts[2] === 'card') return {
        p: 'card',
        c: pathParts[4],
    }
    if (!taxonomy.response && !taxonomy.situation && !searchParams.by && !searchParams.bsnf && !searchParams.sq) return {
        p: 'home',
    }

    return {
        p: 'results',
        by: decodeURIComponent(routeBy ? routeBy.replace('by-', '') : searchParams.by || ''),
        bsnf: decodeURIComponent(routeBsnf ? routeBsnf.replace('bsnf-', '') : searchParams.bsnf || ''),
        sq: searchParams.sq,
        lf: searchParams.lf,
        rf: searchParams.rf,
        sf: searchParams.sf,
        brf: taxonomy.response,
        bsf: taxonomy.situation,
    };
};

export const buildUrl = (params: UrlParams) => {
    const base = `${window.location.protocol}//${window.location.host}`;
    const hash = window.location.hash;
    const routeParams = {...params};
    if (!routeParams.p) return base + hash;
    if (routeParams.p === 'map') return `${base}/map${hash}`
    if (routeParams.p === 'card' && routeParams.c) return `${base}/p/card/c/${routeParams.c}${hash}`;

    const categories = [];
    if (routeParams.bsf) categories.push(routeParams.bsf.split(':').slice(-1));
    if (routeParams.brf) categories.push(routeParams.brf.split(':').slice(-1));
    if (routeParams.by && categories.length < 2) {
        categories.push(`by-${routeParams.by}`);
        delete routeParams.by;
    }
    if (routeParams.bsnf && categories.length < 2) {
        categories.push(`bsnf-${routeParams.bsnf}`);
        delete routeParams.bsnf;
    }
    const category = categories.join('/');
    delete routeParams.p;
    delete routeParams.c;
    delete routeParams.bsf;
    delete routeParams.brf;
    const queryString = new URLSearchParams(routeParams as Record<string, string>).toString();

    return `${base}/${category}${queryString ? `?${queryString}` : ''}${hash}`;
};

const navKey = (params: UrlParams) => {
    const p = params.p || 'home';
    if (p === 'card') return `card|${params.c || ''}`;
    return p + '|';
};

const applyHistory = (params: UrlParams) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
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
    const params = useSelector(getUrlParams) as UrlParams;
    return buildUrl(params);

}

export const useRouteUpdater = () => {
    const params = useSelector(getUrlParams) as UrlParams;
    applyHistory(params);
};
