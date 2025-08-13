import {getColor} from "../../../../../../../../services/colorLogic";
import {Response} from "../../../../../../../../types/cardType";
import useStyles from './responseSectionButtons.css'
import cancelOrAddIcon from '../../../../../../../../assets/icon-close-black.svg';
import {store} from "../../../../../../../../store/store";
import {addResponseFilter, removeResponseFilter} from "../../../../../../../../store/filter/filterSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../../../../types/dynamicThemeApp.ts";
import {createKeyboardHandler} from "../../../../../../../../services/keyboardHandler";

const ResponseSectionButton = ({response, isSelected}: { response: Response, isSelected: boolean }) => {
    const {color} = getColor({response})
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({color, isSelected, accessibilityActive: theme.accessibilityActive});
    const onClick = () => {
        if (isSelected) return store.dispatch(removeResponseFilter(response.id));
        return store.dispatch(addResponseFilter(response.id));
    }

    const handleKeyDown = createKeyboardHandler(onClick);

    return (
        <div
            className={classes.container}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={isSelected ? `Remove ${response.name} filter` : `Add ${response.name} filter`}
            aria-pressed={isSelected}
        >
            <div className={classes.label} key={response.id}>
                <span className={classes.dot}/>
                <span>{response.name}</span>
                <img alt="cancel or add icon" src={cancelOrAddIcon} className={classes.cancelOrAdd}/>
            </div>
        </div>);
}
export default ResponseSectionButton;
