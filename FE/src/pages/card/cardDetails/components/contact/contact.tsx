import Connection from "../../../../../components/connection/connection";
import {BranchUrl} from "../../../../../types/cardType";

const Contact = ({email, phoneNumbers, websites, address}: {email:string, phoneNumbers: string[], websites:BranchUrl[] | null, address:string}) =>{
    const contactTitle = window.strings.cardDetails.contactDetails
    console.log('email', email, 'phoneNumbers', phoneNumbers, 'websites', websites, 'address', address);
    return (
        <div>
            <span>{contactTitle}:</span>
            {phoneNumbers.map((phoneNumber) => (<Connection type={`tel`} text={phoneNumber} key={phoneNumber} />))}
            {email && (<Connection text={email} type={`mailto`} />)}
            {websites && websites.map((website) => (<Connection type={`website`} text={website.title} link={website.href} key={website.href} />))}
            {address && (<Connection text={address} type={`address`} />)}
        </div>
    )
}
export default Contact;
