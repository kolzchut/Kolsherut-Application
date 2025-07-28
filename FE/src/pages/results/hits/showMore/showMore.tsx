import useStyles from './showMore.css';
import {replaceMacro} from "../../../../services/str.ts";
const ShowMore = ({count, onClick}: {count:number, onClick: ()=>void}) =>{
    const classes = useStyles();
    const text = replaceMacro({stringWithMacro:window.strings.results.showMoreOrganizations, macro:"%%MACRO%%", replacement:count?.toString() });
    return <button className={classes.root} onClick={onClick}>
        {text}
    </button>
}
export default ShowMore;
