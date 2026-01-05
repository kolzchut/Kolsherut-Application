import useStyles from "./controlledModal.css";
import modals, {IModals, modalKeys} from "./models/modals";
import {useSelector} from "react-redux";
import {getModal} from "../../store/general/general.selector";
import {setModal} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import {useTheme} from 'react-jss';
import IDynamicThemeApp from "../../types/dynamicThemeApp";
import {useModalAccessibility} from "./utils/useModalAccessibility";

const ControlledModal = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles(theme);
    const modal = useSelector(getModal);

    const onClose = () => store.dispatch(setModal(null));
    const {modalRef} = useModalAccessibility(!!modal, onClose);

    if (!modal || !modalKeys.includes(modal as IModals)) return <></>;

    const Modal = modals[modal as IModals];

    return <div
        className={classes.modalBackground}
        onClick={onClose}
        tabIndex={0}
        role="dialog"
        aria-modal="true"
        aria-label="Modal dialog">
        <div
            className={classes.modalContent}
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}>
            <Modal/>
        </div>
    </div>
};
export default ControlledModal;
