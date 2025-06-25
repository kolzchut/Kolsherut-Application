import useStyle from "./quickAction.css";
import telIcon from "../../../../../assets/icon-call-white.svg"
import mailIcon from "../../../../../assets/icon-mail-blue.svg"

const QuickAction = ({phoneNumber, email}:{phoneNumber?: string, email?: string}) =>{
    const classes = useStyle();
    if(!phoneNumber && !email) return <></>;
    const mailText = window.strings.quickActionMail
    return <div className={classes.mainDiv}>
        {phoneNumber &&
            <a href={`tel:${phoneNumber}`} target="_blank" className={classes.aTagTel}>
                <img src={telIcon} className={classes.aTagImage} alt={"Call"} />
                <span>{phoneNumber}</span>
            </a>}
        {email && <a href={`tel:${phoneNumber}`} target="_blank" className={classes.aTagMail}>
            <img src={mailIcon} className={classes.aTagImage} alt={"Mail"} />
            <span>{mailText}</span>
        </a>}
    </div>

}
export default QuickAction;
