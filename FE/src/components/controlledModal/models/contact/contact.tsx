import useStyle from "./contact.css"
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../../../store/general/general.selector.ts";
import {isMobileScreen} from "../../../../services/media.ts";

const Contact = () => {
    const isMobile = isMobileScreen();
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyle({isMobile, accessibilityActive});
    const close = () => store.dispatch(setModal(null));
    const strings = window.strings.staticModals.contact;
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
        </div>
    </div>
}
export default Contact;
