import useStyle from "./siteMap.css.ts"
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";
import {useEffect} from "react";
import {useTheme} from 'react-jss';
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";
import {getSitemap} from "../../../../store/data/data.selector.ts";
import {useSelector} from "react-redux";
import homepageEvents from "../../../../services/gtag/homepageEvents.ts";
import setSiteMapInStore from "../../../../services/setSiteMapInStore.ts";

const SiteMap = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle(theme);
    const close = () => store.dispatch(setModal(null));
    const siteMapData = useSelector(getSitemap);
    const texts = window.strings.siteMap;
    useEffect(() => {
        homepageEvents.openedSiteMapEvent();
        if(!siteMapData?.responseUrls?.length && !siteMapData?.situationsUrls?.length)
            setSiteMapInStore();
    }, []);
    if (!siteMapData) return <></>;
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div>
            <h1>{texts.title}</h1>
            <h2>{texts.subtitle}</h2>
        </div>
        <div>
            <h3>{texts.responses}</h3>
            <ul className={classes.mapDiv}>
                {siteMapData.responseUrls?.map((response) => (
                    <a className={classes.text} href={response.link} key={response.link}>{response.name}</a>
                ))}
                {
                    siteMapData.responseUrls?.length === 0 && <span>{texts.loading}</span>
                }
            </ul>
            <h3>{texts.situations}</h3>
            <ul className={classes.mapDiv}>
                {siteMapData.situationsUrls?.map((situation) => (
                    <a className={classes.text} href={situation.link} key={situation.link}>{situation.name}</a>
                ))}
                {
                    siteMapData.situationsUrls?.length === 0 && <span>{texts.loading}</span>
                }
            </ul>
        </div>
    </div>
}
export default SiteMap;
