import useStyle from "./header.css";
import {setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps";
import hamburger from "../../assets/icon-hamburger.svg";
import SearchInput from "./searchInput/searchInput";

const logo = "/icons/logo.svg"

const Header = ({showLogo = true, showSearchbar = true}: { showLogo?: boolean, showSearchbar?: boolean }) => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyle();

    const handleIconClick = () => {
        if (!isMobile) return store.dispatch(setPage('home'))
        return store.dispatch(setShowSidebar(true));
    }
    const {names} = window.strings.staticModals

    return <>
        <div className={classes.root}>
            {showLogo && <img onClick={handleIconClick} className={classes.logo} src={isMobile ? hamburger : logo}
                              alt={"kolsherut logo"}/>}
            {showSearchbar && <SearchInput/>}
            {!isMobile && <div className={classes.linksDiv}>
                <span className={classes.link} onClick={() => store.dispatch(setModal("About"))}>{names.about}</span>
                <span className={classes.link}
                      onClick={() => store.dispatch(setModal("AddService"))}>{names.addService}</span>
                <span className={classes.link}
                      onClick={() => store.dispatch(setModal("Partners"))}>{names.partners}</span>
                <span className={classes.link}
                      onClick={() => store.dispatch(setModal("Contact"))}>{names.contact}</span>
            </div>}
        </div>
    </>
}

export default Header;
