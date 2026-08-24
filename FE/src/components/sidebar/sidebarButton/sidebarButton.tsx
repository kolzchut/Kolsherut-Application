import useStyles from "./sidebarButton.css";
import arrowLeft from "../../../assets/icon-chevron-left-gray-4.svg"
import PageLink from "../../links/pageLink";
import {StaticPageSlug} from "../../../services/url/staticPages";

const SidebarButton = ({text, page, onClick}: { text: string, page?: StaticPageSlug, onClick?: () => void }) => {
    const classes = useStyles();
    const content = <>
        <span>{text}</span>
        <img alt={"arrow left"} src={arrowLeft}/>
    </>;
    // PageLink already closes the sidebar when navigating.
    if (page) return <PageLink page={page} className={classes.mainDiv}>{content}</PageLink>;
    return <div className={classes.mainDiv} onClick={onClick}>{content}</div>
};
export default SidebarButton;
