import {setAccessibility, setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import hamburger from "../../assets/icon-hamburger.svg";
import accessibilityInactive from "../../assets/accessability.svg";
import accessibilityActive from "../../assets/accessabilityActive.svg";
import SearchInput from "./searchInput/searchInput";
import {useDispatch, useSelector} from "react-redux";
import {useTheme} from 'react-jss';
import {isAccessibilityActive} from "../../store/general/general.selector";
import {isMobileScreen} from "../../services/media.ts";
import useStyles from "./header.css.ts"
import IDynamicThemeApp from "../../types/dynamicThemeApp.ts";


const logo = "/icons/logo.svg"

const Header = ({showLogo = true, showSearchbar = true, refreshPage}: { showLogo?: boolean, showSearchbar?: boolean, refreshPage?: ()=>void }) => {
    const accessibilityActiveFromRedux = useSelector(isAccessibilityActive);
    const isMobileFromMedia = isMobileScreen();

    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({theme});
    const dispatch = useDispatch();

    const handleIconClick = () => {
        if (!isMobileFromMedia) return dispatch(setPage('home'))
        return dispatch(setShowSidebar(true));
    }
    const {names} = window.strings.staticModals
    const toggleAccessibility = () => {
        dispatch(setAccessibility(!accessibilityActiveFromRedux));
    }
    const accessibilityIcon = accessibilityActiveFromRedux ? accessibilityActive : accessibilityInactive;

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>, modalName: string) => {
        e.preventDefault();
        dispatch(setModal(modalName))
    }

    return <>
        <div className={classes.root} key={'1'}>

            {!isMobileFromMedia && <div className={classes.linksAndButtonsDiv}>
                <button title={window.strings.toolTips.accessibility || "toggle accessibility"}
                        className={classes.button} onClick={toggleAccessibility} key={'2'}>
                    <img src={accessibilityIcon} alt={'activate accessibility'} className={classes.accIcon} key={'3'}/>
                </button>
                <div className={classes.linksDiv}>
                    <a href={`?m=About`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "About")}>{names.about}</a>
                    <a href={`?m=AddService`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "AddService")}>{names.addService}</a>
                    <a href={`?m=Partners`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "Partners")}>{names.partners}</a>
                    <a href={`?m=Contact`} className={classes.link}
                       onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, "Contact")}>{names.contact}</a>
                </div>

            </div>}
            {showSearchbar && <SearchInput refreshPage={refreshPage}/>}
            {showLogo &&
                <img onClick={handleIconClick} className={classes.logo} src={isMobileFromMedia ? hamburger : logo}
                     alt={"kolsherut logo"}/>}

        </div>
    </>
}

export default Header;
