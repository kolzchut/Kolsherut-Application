import useStyles from "./loader.css"

const Loader = () => {
    const classes = useStyles();
    const iterations = window.config.loaderIterations;
    return <div className={classes.root}>
        {Array.from({length: iterations}).map((_, index) => (
            <div key={index} className={classes.loader}></div>
        ))}
    </div>

}
export default Loader;
