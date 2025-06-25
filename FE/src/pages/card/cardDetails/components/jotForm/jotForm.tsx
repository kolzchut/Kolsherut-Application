import useStyle from './jotForm.css';
import editIcon from '../../../../../assets/icon-edit-gray-1.svg';

interface IProps {
    serviceName: string,
    cardId: string
}

const JotForm = ({serviceName, cardId}:IProps) => {
    const title = window.strings.cardDetails.jotForm;
    const link = `${window.config.jotFormBaseLink}?service_name=${encodeURIComponent(serviceName)}&id=${encodeURIComponent(cardId)}&url=${encodeURIComponent(window.location.href)}`;

    const classes = useStyle();
    return (
        <a className={classes.aTag} href={link}>
            <img src={editIcon} alt={'Edit icon'} />
            <span className={classes.title}>{title}</span>
        </a>
    )
}
export default JotForm;
