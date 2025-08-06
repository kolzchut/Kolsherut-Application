import {UIProvider} from "./context";
import Results from "../results";

const ResultsWithContext = () =>{

    return (
        <UIProvider>
            <Results/>
        </UIProvider>
    )
}
export default ResultsWithContext;
