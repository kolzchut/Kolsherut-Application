import useStyle from "./header.css";
import {setAccessibility, setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps";
import hamburger from "../../assets/icon-hamburger.svg";
import accessibilityInactive from "../../assets/accessability.svg";
import accessibilityActive from "../../assets/accessabilityActive.svg";
import SearchInput from "./searchInput/searchInput";
import {isAccessibilityActive} from "../../store/general/general.selector.ts";
import {useDispatch, useSelector} from "react-redux";

const logo = "/icons/logo.svg"

const Header = ({showLogo = true, showSearchbar = true}: { showLogo?: boolean, showSearchbar?: boolean }) => {
    const isMobile = useMediaQuery(widthOfMobile);
    const accessibility = useSelector(isAccessibilityActive);
    const classes = useStyle();
    const dispatch = useDispatch();

    const handleIconClick = () => {
        if (!isMobile) return store.dispatch(setPage('home'))
        return store.dispatch(setShowSidebar(true));
    }
    const {names} = window.strings.staticModals
    const toggleAccessibility = ()=>{
        dispatch(setAccessibility(!accessibility));
    }
    const accessibilityIcon = accessibility ? accessibilityActive : accessibilityInactive;
    const btnStyles = accessibility ? classes.accessibilityButton: classes.button;
    const linkStyle = accessibility ? classes.accessibilityLink : classes.link
    return <>
        <div className={classes.root}>

            {!isMobile && <div className={classes.linksAndButtonsDiv}>
                <button className={btnStyles} onClick={toggleAccessibility} >
                    <img src={accessibilityIcon} alt={'activate accessibility'} className={classes.accIcon}/>
                </button>
                <div  className={classes.linksDiv}>
                    <span className={linkStyle} onClick={() => store.dispatch(setModal("About"))}>{names.about}</span>
                    <span className={linkStyle}
                          onClick={() => store.dispatch(setModal("AddService"))}>{names.addService}</span>
                    <span className={linkStyle}
                          onClick={() => store.dispatch(setModal("Partners"))}>{names.partners}</span>
                    <span className={linkStyle}
                          onClick={() => store.dispatch(setModal("Contact"))}>{names.contact}</span>
                </div>

            </div>}
            {showSearchbar && <SearchInput/>}
            {showLogo && <img onClick={handleIconClick} className={classes.logo} src={isMobile ? hamburger : logo}
                              alt={"kolsherut logo"}/>}

        </div>
    </>
}

export default Header;
