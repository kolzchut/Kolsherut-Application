import useStyle from "./quickAction.css";
import telIcon from "../../../../../assets/icon-call-white.svg"
import mailIcon from "../../../../../assets/icon-mail-blue.svg"
import websiteIcon from "../../../../../assets/icon-external-link-blue.svg";

const QuickAction = ({phoneNumber, email, websiteURL}:{phoneNumber?: string, email?: string, websiteURL?:string}) =>{
    const classes = useStyle();
    if(!phoneNumber && !email && !websiteURL) return <></>;
    const websiteText = window.strings.quickActionWebsite;
    const mailText = window.strings.quickActionMail
    return <div className={classes.mainDiv}>
        {phoneNumber &&
            <a href={`tel:${phoneNumber}`} target="_blank" className={classes.aTagTel}>
                <img src={telIcon} className={classes.aTagImage} alt={"Call"} />
                <span>{phoneNumber}</span>
            </a>}
        {email && <a href={`mailto:${email}`} target="_blank" className={classes.aTagGeneral}>
            <img src={mailIcon} className={classes.aTagImage} alt={"Mail"} />
            <span>{mailText}</span>
        </a>}
        {websiteURL && <a href={websiteURL} target="_blank" className={classes.aTagGeneral}>
            <img src={websiteIcon} className={classes.aTagImage} alt={"Website"} />
            <span>{websiteText}</span>
        </a>}
    </div>

}
export default QuickAction;
