import {Situation} from "../../../../../types/cardType";

const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;

    return <div>
        <span>{targetAudienceTitle}</span>
        {situations.map((situation => (
            <div key={situation.id}>
                <h5>{situation.name}</h5>
            </div>
        )))}
    </div>
}
export default TargetAudience;
