import copyIcon from "../../assets/icon-copy-gray.svg"
import telIcon from "../../assets/icon-call-white.svg"
import mailIcon from "../../assets/icon-mail-blue.svg";
import websiteIcon from "../../assets/icon-external-link-blue.svg";
import addressIcon from "../../assets/icon-nav-blue.svg";

import useStyle from "./connection.css";

type ConnectionType = 'tel' | 'mailto'| 'address' | 'website';
interface IProps {
    text: string;
    type: ConnectionType;
    link?:string;
}

const Connection = ({text, type, link}:IProps) =>{
    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
    }
    const isTel = type === 'tel';
    const classes = useStyle({isTel})
    const iconMap: Record<ConnectionType, string> = {
        tel: telIcon,
        mailto: mailIcon,
        address: addressIcon,
        website: websiteIcon,
    };
    const imageToPresent = iconMap[type] || websiteIcon;

    const additionalTextToLink = (type != 'address'&& type != 'website') ? type : ""
    const fullLink = link || `${additionalTextToLink}:${text}`
    return <div className={classes.root}>
        <a href={fullLink} target="_blank" className={classes.aTag}>
            <img src={imageToPresent} className={classes.aTagImage} alt={isTel ? "Call" : "Email"} />
            <span>{text}</span>
        </a>
        <button className={classes.button} onClick={handleCopy}>
            <img src={copyIcon} alt={"Copy to clipboard"} />
        </button>
    </div>
}

export default Connection;
