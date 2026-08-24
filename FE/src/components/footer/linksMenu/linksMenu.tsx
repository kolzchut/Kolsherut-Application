import useStyles from './linksMenu.css';
import {useEffect, useState} from "react";
import axios from "axios";
import logger from "../../../services/logger/logger";
import {useDispatch} from "react-redux";
import {setModal} from "../../../store/general/generalSlice";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../../types/dynamicThemeApp";
import PageLink from "../../links/pageLink";
import {isStaticPageSlug} from "../../../services/url/staticPages";

interface ILinks {
    title: string,
    url?: string,
    modal?: string
}

const isExternal = (link: ILinks) => !!link.url?.startsWith('http');
const toSlug = (link: ILinks) => link.url?.replace(/^\//, '');

const LinksMenu = () => {
    const [links, setLinks] = useState<Array<ILinks>>([])
    const dispatch = useDispatch();
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles();
    // The accessibility size is a separate static class, see linksMenu.css.ts.
    const linksClass = theme.accessibilityActive ? `${classes.links} ${classes.linksA11y}` : classes.links;

    useEffect(() => {
        const getLinks = async () => {
            try {
                const response = await axios.get(`/configs/linksBelow.json?cacheBuster=${Date.now()}`);
                setLinks(response.data);
            } catch (error) {
                logger.error({message: "Error fetching links below", payload: error});
            }
        }
        getLinks();
    }, []);

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>, link: ILinks) => {
        if (isExternal(link) || !link.modal) return; // external link or no modal to open
        e.preventDefault();
        dispatch(setModal(link.modal));
    }

    if (links.length === 0) return <></>;
    return <div className={classes.mainDiv}>
        {links.map((link: ILinks) => {
            const slug = toSlug(link);
            // an internal content page: navigate in-app, never in a new tab
            if (!link.modal && isStaticPageSlug(slug))
                return <PageLink key={link.title} page={slug} className={linksClass}>{link.title}</PageLink>;
            return <a className={linksClass} key={link.title}
                      href={link.url || "#"}
                      target={isExternal(link) ? '_blank' : undefined}
                      rel={isExternal(link) ? 'noopener noreferrer' : undefined}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, link)}>{link.title}</a>;
        })}
    </div>
}

export default LinksMenu;
