import Connection from "../../../../../components/connection/connection";
import {ICard, ServiceURL} from "../../../../../types/cardType";
import useStyles from "./contact.css";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";

interface IProps {
    card:ICard,
    email: string,
    phoneNumbers: string[],
    websites: ServiceURL[] | null,
    address: {
        text: string,
        geom: [number,number]
    }
}

const Contact = ({email, phoneNumbers, websites, address,card}: IProps) => {
    const contactTitle = window.strings.cardDetails.contactDetails
    const {macro, addressLink} = window.config.redirects;
    const addressFullLink = addressLink.replace(macro, address?.geom?.reverse().join(','));
    const addressCondition: boolean = !!(address && address.text && Array.isArray(address.geom) && address.geom.length === 2)
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});

    return (
        <div>
            <span className={classes.title}>{contactTitle}</span>
            {phoneNumbers.map((phoneNumber) => (<Connection type={`tel`} text={phoneNumber} key={phoneNumber} card={card} actionType={'phone'}/>))}
            {email && (<Connection text={email} type={`mailto`}  card={card} actionType={'email'}/>)}
            {websites && websites.map((website) => (
                <Connection type={`website`} text={website.href} link={website.href} key={website.href}  card={card} actionType={'url'}/>))}
            {addressCondition && (<Connection text={address.text} link={addressFullLink} type={`address`}  card={card} actionType={'nav'}/>)}
        </div>
    )
}
export default Contact;
