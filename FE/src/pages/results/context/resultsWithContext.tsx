import {UIProvider} from "./context";
import Results from "../results";

const ResultsWithContext = ({headerStyle}:{headerStyle: {[_key: string]: string}}) =>{

    return (
        <UIProvider>
            <Results {...{headerStyle}}/>
        </UIProvider>
    )
}
export default ResultsWithContext;
