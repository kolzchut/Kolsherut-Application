import {Response} from "../../../../../types/cardType";
import useStyle from "./serviceEssence.css";
import Label from "../../../../../components/label/label";
import {getHrefForResults} from "../../../../../services/href";
import { useTheme } from 'react-jss';
import {changingPageToResults} from "../../../../../store/shared/sharedSlice.ts";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";

const ServiceEssence = ({responses}: { responses: Response[] }) => {
    const serviceEssenceTitle = window.strings.cardDetails.serviceEssence
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});

    return <div>
        <span className={classes.title}>{serviceEssenceTitle}</span>
        <div className={classes.linkList}>
            {responses.map((response: Response) => {
                const href = getHrefForResults({searchQuery: response.name,responseFilter: [response.id]});
                const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    changingPageToResults({value: {response_id:response.id, query:response.name}, removeOldFilters:true});
                }
                return <a href={href} key={response.id} className={classes.link}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>)=>onClick(e)}>
                    <Label key={response.id} response={response}/>
                </a>
            })}
        </div>
    </div>
}
export default ServiceEssence;
