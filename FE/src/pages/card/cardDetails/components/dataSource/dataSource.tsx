import useStyle from "./dataSource.css";
import { useSelector } from 'react-redux';
import { isAccessibilityActive } from "../../../../../store/general/general.selector";

const DataSource = ({ dataSource }: { dataSource: string[] }) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyle({ accessibilityActive });
    if (!dataSource || dataSource.length === 0) return <></>
    return <>
        {dataSource.map((source, index) => (
            <span key={index} className={classes.text} dangerouslySetInnerHTML={{ __html: source }}/>
        ))}
    </>
}
export default DataSource;
