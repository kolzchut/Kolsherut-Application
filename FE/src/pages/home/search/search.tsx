import useStyle from './search.css';
import kolsherutLogo from "../../../assets/logo-white.svg"
import SearchInput from "./searchInput/searchInput";
import nationalDigitalLogo from '../../../assets/logo-digital-israel.png'
import kolzchutLogo from "../../../assets/logo-kolzchut.png"
import mojLogo from "../../../assets/logo-moj.png"
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../constants/mediaQueryProps.ts";
import {store} from "../../../store/store.ts";
import {setPage, setShowSidebar} from "../../../store/general/generalSlice.ts";
import hamburger from "../../../assets/icon-hamburger-gray-5.svg";
import homepageBackground from '../../../assets/homepage-background.svg';

const Search = () => {
    const classes = useStyle();
    const isMobile = useMediaQuery(widthOfMobile);
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
