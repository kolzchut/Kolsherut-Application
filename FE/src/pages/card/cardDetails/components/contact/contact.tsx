const Contact = ({email, servicePhoneNumbers}: {email:string, servicePhoneNumbers: string[]}) =>{
    const contactTitle = window.strings.cardDetails.contactDetails
    return (
        <div>
            <span>{contactTitle}:</span>
            {servicePhoneNumbers.map((phoneNumber) => (
                <a key={phoneNumber} href={`tel:${phoneNumber}`}>
                    <span>{phoneNumber}</span>
                </a>
            ))}
            {email && (
                <a href={`mailto:${email}`}>
                    <span>{email}</span>
                </a>
            )}
        </div>
    )
}
export default Contact;
