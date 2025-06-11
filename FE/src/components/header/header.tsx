import useStyle from "./header.css.ts";
const homePage = () => {
        const classes = useStyle();
        return <div className={classes.root}>
                <div>
                        <a href="https://google.com">אודות</a>
                        <a href="https://google.com">הוספת שירות חסר</a>
                        <a href="https://google.com">שותפים</a>
                        <a href="https://google.com">צרו קשר</a>
                </div>
                <div></div>
        </div>
}

export default homePage;
