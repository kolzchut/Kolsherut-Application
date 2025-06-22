import {Response} from "../../../../../types/cardType";

const ServiceEssence = ({responses}:{responses: Response[]}) =>{
    const serviceEssenceTitle =window.strings.cardDetails.serviceEssence
    return <div>
        <span>{serviceEssenceTitle}</span>
        {responses.map((response => (
            <div key={response.id}>
                <h5>{response.name}</h5>
            </div>
        )))}
    </div>
}
export default ServiceEssence;
