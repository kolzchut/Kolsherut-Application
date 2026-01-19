import useStyles from "./controlledModal.css";
import modals, {IModals, modalKeys} from "./models/modals";
import {useDispatch, useSelector} from "react-redux";
import {getModal, getPage} from "../../store/general/general.selector";
import {setModal, setPage} from "../../store/general/generalSlice";
import {useTheme} from 'react-jss';
import IDynamicThemeApp from "../../types/dynamicThemeApp";
import {useModalAccessibility} from "./utils/useModalAccessibility";

const ControlledModal = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles(theme);
    const modal = useSelector(getModal);
    const page = useSelector(getPage);
    const dispatch = useDispatch()


    const onClose = () => {
        dispatch(setModal(null))
        if (page === "sitemap")
            dispatch(setPage(null))
    };
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
