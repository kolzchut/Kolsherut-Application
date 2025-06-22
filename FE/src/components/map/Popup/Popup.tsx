import useStyles from './Popup.css';
import {FC, RefObject} from "react";

export interface PopupProps {
    popupRef: RefObject<HTMLDivElement | null>;
    contentRef: RefObject<HTMLDivElement | null>;
}

const Popup: FC<PopupProps> = ({popupRef, contentRef}) => {
    const classes = useStyles();

    return (
        <div ref={popupRef} className={classes.popup}>
            <div ref={contentRef}/>
        </div>
    );
};

export default Popup;
