import Connection from "../../../../../components/connection/connection";
import {BranchUrl} from "../../../../../types/cardType";
import useStyles from "./contact.css";

interface IProps {
    email: string,
    phoneNumbers: string[],
    websites: BranchUrl[] | null,
    address: {
        text: string,
        geom: [number,number]
    }
}

const Contact = ({email, phoneNumbers, websites, address}: IProps) => {
    const contactTitle = window.strings.cardDetails.contactDetails
    const {macro, addressLink} = window.config.redirects;
    const addressFullLink = addressLink.replace(macro, address?.geom?.reverse().join(','));
    const addressCondition: boolean = !!(address && address.text && Array.isArray(address.geom) && address.geom.length === 2)
    const classes = useStyles();

    return (
        <div>
            <span className={classes.title}>{contactTitle}:</span>
            {phoneNumbers.map((phoneNumber) => (<Connection type={`tel`} text={phoneNumber} key={phoneNumber}/>))}
            {email && (<Connection text={email} type={`mailto`}/>)}
            {websites && websites.map((website) => (
                <Connection type={`website`} text={website.title} link={website.href} key={website.href}/>))}
            {addressCondition && (<Connection text={address.text} link={addressFullLink} type={`address`}/>)}
        </div>
    )
}
export default Contact;
