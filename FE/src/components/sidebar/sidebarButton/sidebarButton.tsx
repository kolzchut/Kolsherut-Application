import useStyles from "./sidebarButton.css";
import {store} from "../../../store/store";
import {setModal, setShowSidebar} from "../../../store/general/generalSlice";
import arrowLeft from "../../../assets/icon-chevron-left-gray-4.svg"
const SidebarButton = ({text, modalName,onClick}:{text:string,modalName?:string, onClick?:()=>void}) => {
    const classes = useStyles();
    const onSelect = () => {
        if(!modalName && onClick) return onClick();
        store.dispatch(setModal(modalName))
        store.dispatch(setShowSidebar(false))
    };
    return <div className={classes.mainDiv} onClick={onSelect}>
       <span>{text}</span>
        <img alt={"arrow left"} src={arrowLeft}/>
    </div>
};
export default SidebarButton;
