import {getColor} from "../../../../../../../../services/colorLogic";
import {Response} from "../../../../../../../../types/cardType";
import useStyles from './responseSectionButtons.css'
import cancelOrAddIcon from '../../../../../../../../assets/icon-close-black.svg';
import {store} from "../../../../../../../../store/store";
import {addResponseFilter, removeResponseFilter} from "../../../../../../../../store/filter/filterSlice";

const ResponseSectionButton = ({response, isSelected}: { response: Response, isSelected: boolean }) => {
    const {color} = getColor({response})
    const classes = useStyles({color, isSelected});
    const onClick = () => {
        if (isSelected) return store.dispatch(removeResponseFilter(response.id));
        return store.dispatch(addResponseFilter(response.id));
    }
    return (
        <div className={classes.container} onClick={onClick}>
            <div className={classes.label} key={response.id}>
                <span className={classes.dot}/>
                <span>{response.name}</span>
                <img alt="cancel or add icon" src={cancelOrAddIcon} className={classes.cancelOrAdd}/>
            </div>
        </div>);
}
export default ResponseSectionButton;
