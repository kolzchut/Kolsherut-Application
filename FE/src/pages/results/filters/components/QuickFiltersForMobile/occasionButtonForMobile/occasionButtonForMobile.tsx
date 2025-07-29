import cancelOrAddIcon from '../../../../../../assets/icon-close-black.svg';
import {Situation, Response} from "../../../../../../types/cardType";
import useStyle from "./occasionButtonForMobile.css";
import {store} from "../../../../../../store/store";
import {
    addResponseFilter,
    removeResponseFilter,
    removeSituationFilter
} from "../../../../../../store/filter/filterSlice";
import {getColor} from "../../../../../../components/label/labelLogic";
import resultsAnalytics from "../../../../../../services/gtag/resultsEvents";


const OccasionButtonForMobile = ({response, situation, isSelected, count = 0}: {
    response?: Response,
    situation?: Situation,
    isSelected: boolean,
    count?: number | string
}) => {
    const {isResponse, color} = getColor({response})
    const classes = useStyle({color, isSelected});
    const occasion = response || situation;
    if (!occasion) return <></>;
    const onClick = () => {
        resultsAnalytics.quickFilterActivatedEvent();
        if (isResponse) {
            if (isSelected) return store.dispatch(removeResponseFilter(occasion.id));
            return store.dispatch(addResponseFilter(occasion.id));
        }
        if (isSelected) return store.dispatch(removeSituationFilter(occasion.id));
        return store.dispatch(removeSituationFilter(occasion.id));
    }
    return (
        <div className={classes.container} onClick={onClick}>
            <div className={classes.label} key={occasion.id}>
                <span className={classes.dot}/>
                <span>{`${occasion.name} ${count != 0 ? `(${count})` : ""}`} </span>
                {isSelected && <img alt="cancel or add icon" src={cancelOrAddIcon} className={classes.cancelOrAdd}/>}
            </div>
        </div>);
}


export default OccasionButtonForMobile;
