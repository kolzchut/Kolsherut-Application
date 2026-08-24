import {setAccessibility, setPage, setShowSidebar} from "../../store/general/generalSlice";
import hamburger from "../../assets/icon-hamburger.svg";
import accessibilityInactive from "../../assets/accessability.svg";
import accessibilityActive from "../../assets/accessabilityActive.svg";
import SearchInput from "./searchInput/searchInput";
import {useDispatch, useSelector} from "react-redux";
import {useTheme} from 'react-jss';
import {isAccessibilityActive} from "../../store/general/general.selector";
import useStyles from "./header.css"
import IDynamicThemeApp from "../../types/dynamicThemeApp";
import PageLink from "../links/pageLink";


const logo = "/icons/logo.svg"

// showHomeLink is for pages that hide the logo (which is the usual way back home),
// so the header carries an explicit "home" link instead. It sits outside the links row,
// in the free space to its right, so the four links keep their exact home-page layout.
const Header = ({showLogo = true, showSearchbar = true, showHomeLink = false, refreshPage}: { showLogo?: boolean, showSearchbar?: boolean, showHomeLink?: boolean, refreshPage?: ()=>void }) => {
    const accessibilityActiveFromRedux = useSelector(isAccessibilityActive);

    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({theme});
    const dispatch = useDispatch();

    const handleLogoClick = () => dispatch(setPage('home'));
    const handleHamburgerClick = () => dispatch(setShowSidebar(true));

    const {names} = window.strings.staticModals
    const toggleAccessibility = () => {
        dispatch(setAccessibility(!accessibilityActiveFromRedux));
    }
    const accessibilityIcon = accessibilityActiveFromRedux ? accessibilityActive : accessibilityInactive;

    return <>
        <div className={classes.root} key={'1'}>

            <div className={classes.linksAndButtonsDiv}>
                <button title={window.strings.toolTips.accessibility || "toggle accessibility"}
                        className={classes.button} onClick={toggleAccessibility} key={'2'}>
                    <img src={accessibilityIcon} alt={'activate accessibility'} className={classes.accIcon} key={'3'}/>
                </button>
                
                <div className={classes.linksDiv}>
                    <PageLink page={"about"} className={classes.link}
                              activeClassName={classes.activeLink}>{names.about}</PageLink>
                    <PageLink page={"missing"} className={classes.link}
                              activeClassName={classes.activeLink}>{names.addService}</PageLink>
                    <PageLink page={"partners"} className={classes.link}
                              activeClassName={classes.activeLink}>{names.partners}</PageLink>
                    <PageLink page={"contact"} className={classes.link}
                              activeClassName={classes.activeLink}>{names.contact}</PageLink>
                </div>

            </div>
            {showHomeLink && <PageLink page={"home"} className={`${classes.link} ${classes.homeLink}`}
                                       activeClassName={classes.activeLink}>
                {names.home}
            </PageLink>}
            {showSearchbar && <SearchInput refreshPage={refreshPage}/>}
            {showLogo && <>
                <img onClick={handleHamburgerClick} className={classes.hamburgerIcon} src={hamburger}
                     alt={"open menu"}/>
                <img onClick={handleLogoClick} className={classes.logo} src={logo}
                     alt={"kolsherut logo"}/>
            </>}

        </div>
    </>
}

export default Header;
