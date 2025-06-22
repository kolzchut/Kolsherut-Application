import {FC, RefObject} from "react";

export interface PopupProps {
    popupRef: RefObject<HTMLDivElement | null>;
    contentRef: RefObject<HTMLDivElement | null>;
}

const Popup: FC<PopupProps> = ({popupRef, contentRef}) => {
    return (
        <div ref={popupRef}>
            <div ref={contentRef}/>
        </div>
    );
};

export default Popup;
