import useStyle from "./header.css";
import {setAccessibility, setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps";
import hamburger from "../../assets/icon-hamburger.svg";
import accessibilityInactive from "../../assets/accessability.svg";
import accessibilityActive from "../../assets/accessabilityActive.svg";
import SearchInput from "./searchInput/searchInput";
import {isAccessibilityActive} from "../../store/general/general.selector";
import {useDispatch, useSelector} from "react-redux";

const logo = "/icons/logo.svg"

const Header = ({showLogo = true, showSearchbar = true}: { showLogo?: boolean, showSearchbar?: boolean }) => {
    const isMobile = useMediaQuery(widthOfMobile);
    const accessibility = useSelector(isAccessibilityActive);
    const classes = useStyle({accessibilityActive: accessibility});
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
    const btnStyles = accessibility ? classes.accessibilityButton : classes.button;
    const linkStyle = accessibility ? classes.accessibilityLink : classes.link
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>, modalName: string) => {
        e.preventDefault();
        dispatch(setModal(modalName))
    }

    return <>
        <div className={classes.root}>

            {!isMobile && <div className={classes.linksAndButtonsDiv}>
                <button className={btnStyles} onClick={toggleAccessibility}>
                    <img src={accessibilityIcon} alt={'activate accessibility'} className={classes.accIcon}/>
                </button>
                <div className={classes.linksDiv}>
                    <a href={`?p=home&m=About`} className={linkStyle}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "About")}>{names.about}</a>
                    <a href={`?p=home&m=AddService`} className={linkStyle}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "AddService")}>{names.addService}</a>
                    <a href={`?p=home&m=Partners`} className={linkStyle}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "Partners")}>{names.partners}</a>
                    <a href={`?p=home&m=Contact`} className={linkStyle}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "Contact")}>{names.contact}</a>
                </div>

            </div>}
            {showSearchbar && <SearchInput/>}
            {showLogo && <img onClick={handleIconClick} className={classes.logo} src={isMobile ? hamburger : logo}
                              alt={"kolsherut logo"}/>}

        </div>
    </>
}

export default Header;
