import {setPage, setShowSidebar} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import closeIcon from "../../assets/icon-close-black.svg";
import useStyles from "./sidebar.css";
import {useSelector} from "react-redux";
import {getShowSidebar} from "../../store/general/general.selector";
import SidebarButton from "./sidebarButton/sidebarButton";
import logo from "../../assets/logo.svg";
const Sidebar = () => {
    const classes = useStyles();
    const showSidebar = useSelector(getShowSidebar)
    if(!showSidebar) return <></>
    const {names} = window.strings.staticModals
    const onClose = () => store.dispatch(setShowSidebar(false));
    return <div className={classes.modalBackground} onClick={onClose}>
        <div className={classes.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={classes.closeIcon} onClick={onClose}><img src={closeIcon} alt={"close icon"}/></button>
            <img onClick={() => store.dispatch(setPage('home'))} className={classes.logo} src={logo} alt={"kolsherut logo"}/>
            <SidebarButton text={names.about} modalName={"About"}/>
            <SidebarButton text={names.addService} modalName={"AddService"}/>
            <SidebarButton text={names.partners} modalName={"Partners"}/>
            <SidebarButton text={names.contact} modalName={"Contact"}/>
        </div>
    </div>
};
export default Sidebar;
