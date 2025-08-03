import {setAccessibility, setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import hamburger from "../../assets/icon-hamburger.svg";
import accessibilityInactive from "../../assets/accessability.svg";
import accessibilityActive from "../../assets/accessabilityActive.svg";
import SearchInput from "./searchInput/searchInput";
import {isAccessibilityActive} from "../../store/general/general.selector";
import {useDispatch, useSelector} from "react-redux";
import {isMobileScreen} from "../../services/media.ts";

const logo = "/icons/logo.svg"

const Header = ({showLogo = true, showSearchbar = true, headerStyle}: { showLogo?: boolean, showSearchbar?: boolean , headerStyle: {[_key: string]: string}}) => {
    const isMobile = isMobileScreen();
    const accessibility = useSelector(isAccessibilityActive);
    const classes = headerStyle;
    const dispatch = useDispatch();

    const handleIconClick = () => {
        if (!isMobile) return dispatch(setPage('home'))
        return dispatch(setShowSidebar(true));
    }
    const {names} = window.strings.staticModals
    const toggleAccessibility = () => {
        dispatch(setAccessibility(!accessibility));
    }
    const accessibilityIcon = accessibility ? accessibilityActive : accessibilityInactive;

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>, modalName: string) => {
        e.preventDefault();
        dispatch(setModal(modalName))
    }

    return <>
        <div className={classes.root} key={'1'}>

            {!isMobile && <div className={classes.linksAndButtonsDiv}>
                <button title={window.strings.toolTips.accessibility || "toggle accessibility"} className={classes.button} onClick={toggleAccessibility} key={'2'}>
                    <img src={accessibilityIcon} alt={'activate accessibility'} className={classes.accIcon} key={'3'}/>
                </button>
                <div className={classes.linksDiv}>
                    <a href={`?p=home&m=About`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "About")}>{names.about}</a>
                    <a href={`?p=home&m=AddService`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "AddService")}>{names.addService}</a>
                    <a href={`?p=home&m=Partners`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "Partners")}>{names.partners}</a>
                    <a href={`?p=home&m=Contact`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "Contact")}>{names.contact}</a>
                </div>

            </div>}
            {showSearchbar && <SearchInput headerStyle={headerStyle}/>}
            {showLogo && <img onClick={handleIconClick} className={classes.logo} src={isMobile ? hamburger : logo}
                              alt={"kolsherut logo"}/>}

        </div>
    </>
}

export default Header;
