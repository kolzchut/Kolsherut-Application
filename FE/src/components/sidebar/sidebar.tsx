import {setAccessibility, setPage, setShowSidebar} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import closeIcon from "../../assets/icon-close-black.svg";
import useStyles from "./sidebar.css";
import {useDispatch, useSelector} from "react-redux";
import {getShowSidebar, isAccessibilityActive} from "../../store/general/general.selector";
import SidebarButton from "./sidebarButton/sidebarButton";
import accessibilityInactive from "../../assets/accessability.svg";
import accessibilityActive from "../../assets/accessabilityActive.svg";

const logo = "/icons/logo.svg"

const Sidebar = () => {
    const classes = useStyles();
    const showSidebar = useSelector(getShowSidebar)
    const accessibility = useSelector(isAccessibilityActive);
    const dispatch = useDispatch();
    const toggleAccessibility = () => {
        dispatch(setAccessibility(!accessibility));
    }
    const {names} = window.strings.staticModals
    const onClose = () => store.dispatch(setShowSidebar(false));
    const btnStyles = accessibility ? classes.accessibilityButton : classes.button;
    const accessibilityIcon = accessibility ? accessibilityActive : accessibilityInactive;

    if (!showSidebar) return <></>
    return <div className={classes.modalBackground} onClick={onClose}>
        <div className={classes.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={classes.closeIcon} onClick={onClose}><img src={closeIcon} alt={"close icon"}/></button>
            <div className={classes.logoAndAccessDiv}>
                <img className={classes.logo} src={logo} alt={"kolsherut logo"} onClick={() => {
                    store.dispatch(setPage('home'));
                    onClose();
                }}/>
                <button className={btnStyles} onClick={toggleAccessibility}>
                    <img src={accessibilityIcon} alt={'activate accessibility'} className={classes.accIcon}/>
                </button>
            </div>
            <SidebarButton text={names.about} modalName={"About"}/>
            <SidebarButton text={names.addService} modalName={"AddService"}/>
            <SidebarButton text={names.partners} modalName={"Partners"}/>
            <SidebarButton text={names.contact} modalName={"Contact"}/>

        </div>
    </div>
};
export default Sidebar;
