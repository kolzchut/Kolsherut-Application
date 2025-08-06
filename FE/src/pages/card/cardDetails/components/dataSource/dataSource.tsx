import useStyle from "./dataSource.css";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";

const DataSource = ({ dataSource }: { dataSource: string[] }) => {
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyle({ accessibilityActive: theme.accessibilityActive });
    if (!dataSource || dataSource.length === 0) return <></>
    return <>
        {dataSource.map((source, index) => (
            <span key={index} className={classes.text} dangerouslySetInnerHTML={{ __html: source }}/>
        ))}
    </>
}
export default DataSource;
