import useStyle from './search.css';
import SearchInput from "./searchInput/searchInput";
import {store} from "../../../store/store";
import {setPage, setShowSidebar} from "../../../store/general/generalSlice";
import hamburger from "../../../assets/icon-hamburger-gray-5.svg";
import homepageBackground from '../../../assets/homepage-background.svg';
import {isMobileScreen} from "../../../services/media.ts";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../types/dynamicThemeApp.ts";

const kolsherutLogo = "/icons/logo-white.svg"
const nationalDigitalLogo = "/icons/logo-digital-israel.png"
const kolzchutLogo = "/icons/logo-kolzchut.png"
const mojLogo = "/icons/logo-moj.png"

const Search = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    const isMobile = isMobileScreen();
    const handleIconClick = () => {
        if (!isMobile) return store.dispatch(setPage('home'))
        return store.dispatch(setShowSidebar(true));
    }
    return (
        <section className={classes.root}>
            <img
                src={homepageBackground}
                alt="רקע ראשי"
                className={classes.backgroundImage}
                fetchPriority="high"
            />
            <div className={classes.aboveDiv}>
                {isMobile && <img onClick={handleIconClick} className={classes.hamburger} src={hamburger}
                                  alt={"hamburger button"}/>}
                <img className={classes.kolsherutLogo} src={kolsherutLogo} alt={"kolsherut Logo"}/>
                <span className={classes.aboveDivText}>{window.strings.home.aboveDivText}</span>
            </div>
            <SearchInput/>
            <div className={classes.bottomDiv}>
                <a href={window.config.redirects.kolzchutMainPageLink} target={"_blank"}>
                    <img className={classes.bottomLogos} src={kolzchutLogo} alt={"kolzchut logo"}/>
                </a>
                <a href={window.config.redirects.justiceLink} target={"_blank"}>
                    <img className={classes.bottomLogos} src={mojLogo} alt={"ministry of justice logo"}/>
                </a>
                <a href={window.config.redirects.nationalDigitalLink} target={"_blank"}>
                    <img className={classes.bottomLogos} src={nationalDigitalLogo} alt={"national digital department"}/>
                </a>
            </div>
        </section>
    );
};

export default Search;
