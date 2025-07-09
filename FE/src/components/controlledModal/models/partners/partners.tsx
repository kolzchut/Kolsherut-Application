import useStyle from "./partners.css";
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";

const Partners = () => {
    const classes = useStyle();
    const close = () => store.dispatch(setModal(null));
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
    </div>
}
export default Partners;
