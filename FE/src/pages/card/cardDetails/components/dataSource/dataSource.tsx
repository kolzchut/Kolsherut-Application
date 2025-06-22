const DataSource = ({dataSource}: { dataSource: string[] }) => {

    if (!dataSource || dataSource.length === 0) return <></>
    return <>
        {dataSource.map((source, index) => (
            <span key={index}>
                        {source}
                    </span>
        ))}</>
}
export default DataSource;
