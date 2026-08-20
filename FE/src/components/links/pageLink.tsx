import React from "react";
import {useDispatch, useSelector} from "react-redux";
import {buildUrl} from "../../services/url/route";
import {setPage, setShowSidebar} from "../../store/general/generalSlice";
import {getPage} from "../../store/general/general.selector";
import {StaticPageSlug} from "../../services/url/staticPages";

// 'home' is not a static content page but is linked the same way: buildUrl({p:'home'}) resolves to "/".
export type LinkablePage = StaticPageSlug | 'home';

// Single entry point for navigating to a static content page.
// Renders a real href so crawlers (and the prerendered HTML) see a genuine link,
// while normal left clicks are handled in-app so there is no full page reload.
// When the link points at the page you are already on it is marked aria-current="page",
// and activeClassName (if given) is added so callers can style the indicator themselves.
const PageLink = ({page, className, activeClassName, children}: {
    page: LinkablePage,
    className?: string,
    activeClassName?: string,
    children: React.ReactNode
}) => {
    const dispatch = useDispatch();
    const currentPage = useSelector(getPage);
    const isCurrent = currentPage === page;
    const href = buildUrl({p: page});

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.defaultPrevented) return;
        // let the browser handle new tab / new window clicks
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        dispatch(setShowSidebar(false));
        dispatch(setPage(page));
    };

    const classNames = [className, isCurrent && activeClassName].filter(Boolean).join(' ') || undefined;

    return <a href={href} className={classNames} aria-current={isCurrent ? 'page' : undefined}
              onClick={onClick}>{children}</a>;
};

export default PageLink;
