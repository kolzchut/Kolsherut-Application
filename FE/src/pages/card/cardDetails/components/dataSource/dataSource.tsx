import useStyle from "./dataSource.css";
const DataSource = ({dataSource}: { dataSource: string[] }) => {
    const classes = useStyle();
    if (!dataSource || dataSource.length === 0) return <></>
    return <>
        {dataSource.map((source, index) => (
            <span key={index} className={classes.text} dangerouslySetInnerHTML={{ __html: source }}/>
        ))}
    </>
}
export default DataSource;
