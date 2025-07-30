import useStyle from "./siteMap.css.ts"
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../../constants/mediaQueryProps.ts";
import {useEffect, useState} from "react";
import axios from "axios";
import logger from "../../../../services/logger/logger.ts";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../../../store/general/general.selector.ts";

interface ILink {
    title: string;
    link?: string;
}

interface IGUISiteMap {
    title: string;
    subtitle?: string;
    mapTitle?: string;
    map: Array<ILink>

}

const SiteMap = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyle({isMobile, accessibilityActive});
    const close = () => store.dispatch(setModal(null));
    const [siteMapData, setSiteMapData] = useState<IGUISiteMap | null>(null);
    useEffect(() => {
        const getSiteMap = async () => {
            try {
                const response = await axios.get(`/configs/GUISiteMap.json?cacheBuster=${Date.now()}`);
                setSiteMapData(response.data);
            } catch (error) {
                logger.error({message: "Error fetching site map", payload: error});
            }
        }
        getSiteMap();
    }, []);
    if (!siteMapData) return <></>;
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div>
            <h1>{siteMapData.title}</h1>
            <h2>{siteMapData.subtitle}</h2>
        </div>
        <div>
            <h3>{siteMapData.mapTitle}</h3>
            <ul className={classes.mapDiv}>
                {siteMapData.map.map((link: ILink) => (
                    <a className={classes.text} href={link.link} key={link.title}>{link.title}</a>
                ))}
            </ul>
        </div>
    </div>
}
export default SiteMap;
