import useStyle from "./addService.css";
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";

const AddService = () => {
    const classes = useStyle();
    const strings = window.strings.staticModals.addService;

    const close = () => store.dispatch(setModal(null));
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div className={classes.header}>
            <h1 className={classes.title}>{strings.title}</h1>
            <h3 className={classes.subtitle}>{strings.subtitleOne}</h3>
        </div>

    </div>
}
export default AddService;
