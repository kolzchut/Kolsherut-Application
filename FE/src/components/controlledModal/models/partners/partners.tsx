import useStyle from "./partners.css";
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";
import {isMobileScreen} from "../../../../services/media";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../../../store/general/general.selector.ts";

const Partners = () => {
    const isMobile = isMobileScreen();
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyle({isMobile, accessibilityActive});
    const close = () => store.dispatch(setModal(null));
    const strings = window.strings.staticModals.partners;
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div>
            <h1>{strings.title}</h1>
        </div>
        <div>
            <p  className={classes.text}>{strings.paragraphOne}</p>
            <ul>
            {strings.list.map((item:string, index:number) => (
              <li  className={classes.text} key={index}>{item}</li>
            ))}
            </ul>
            <p  className={classes.text}>{strings.paragraphTwo}</p>
        </div>
    </div>
}
export default Partners;
