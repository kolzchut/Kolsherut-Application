import {ReactNode} from "react";
import useStyles from "./controlledModal.css";

const ControlledModal = ({children, onClose}: { children: ReactNode, onClose: () => void }) => {
    const classes = useStyles();

    return <div className={classes.modalBackground} onClick={onClose}>
        <div className={classes.modalContent} onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    </div>
};
export default ControlledModal;
