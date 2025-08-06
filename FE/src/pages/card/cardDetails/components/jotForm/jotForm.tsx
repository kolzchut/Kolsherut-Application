import useStyle from './jotForm.css';
import editIcon from '../../../../../assets/icon-edit-gray-1.svg';
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";

interface IProps {
    serviceName: string,
    cardId: string
}

const JotForm = ({serviceName, cardId}:IProps) => {
    const title = window.strings.cardDetails.jotForm;
    const link = `${window.config.redirects.jotFormBaseLink}?service_name=${encodeURIComponent(serviceName)}&id=${encodeURIComponent(cardId)}&url=${encodeURIComponent(window.location.href)}`;
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    return (
        <a className={classes.aTag} href={link} target={"_blank"}>
            <img src={editIcon} alt={'Edit icon'} />
            <span className={classes.title}>{title}</span>
        </a>
    )
}
export default JotForm;
