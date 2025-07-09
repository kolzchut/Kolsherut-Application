import useStyles from "./singleFilter.css";

const SingleFilter = ({value, onClick, isFilterActive}: {value: { count?: number, name: string }, onClick: ()=>void, isFilterActive:boolean}) => {
    const classes = useStyles();

    return <div onClick={onClick} className={classes.optionDiv}>
                    <span className={classes.optionText}>
                        <input className={classes.checkBox} type={"checkbox"} readOnly={true} checked={isFilterActive}/>
                        {value.name}
                    </span>
        {!isFilterActive && value.count != undefined && value.count > 0 && <span className={classes.optionValue}>{value.count}</span>}
    </div>

}
export default SingleFilter;
