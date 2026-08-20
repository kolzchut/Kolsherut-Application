import useStyle from "./quickAction.css";
import telIcon from "../../../../../assets/icon-call-white.svg"
import mailIcon from "../../../../../assets/icon-mail-blue.svg"
import websiteIcon from "../../../../../assets/icon-external-link-blue.svg";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";

const QuickAction = ({phoneNumber, email, websiteURL}:{phoneNumber?: string, email?: string, websiteURL?:string}) =>{
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle();
    if(!phoneNumber && !email && !websiteURL) return <></>;
    const websiteText = window.strings.quickActionWebsite;
    const mailText = window.strings.quickActionMail
    // The accessibility sizes are a separate static class, see quickAction.css.ts.
    const withA11y = (base: string) => theme.accessibilityActive ? `${base} ${classes.aTagA11y}` : base;
    return <div className={classes.mainDiv}>
        {phoneNumber &&
            <a href={`tel:${phoneNumber}`} target="_blank" className={withA11y(classes.aTagTel)}>
                <img src={telIcon} className={classes.aTagImage} alt={"Call"} />
                <span>{phoneNumber}</span>
            </a>}
        {email && <a href={`mailto:${email}`} target="_blank" className={withA11y(classes.aTagGeneral)}>
            <img src={mailIcon} className={classes.aTagImage} alt={"Mail"} />
            <span>{mailText}</span>
        </a>}
        {websiteURL && <a href={websiteURL} target="_blank" className={withA11y(classes.aTagGeneral)}>
            <img src={websiteIcon} className={classes.aTagImage} alt={"Website"} />
            <span>{websiteText}</span>
        </a>}
    </div>

}
export default QuickAction;
