import {replaceMacros} from "../str";
import removeSegmentsFromCanonical from "./removeSegmentsFromCanonical";
import pipe from "../../utilities/pipe.ts";
import removeStringAfterTheQuestionMark from "./RemoveStringAfterTheQuestionMark.ts";

interface Iprops{
    metaTags:any,
    macrosAndReplacements:{ [key: string]: string }
    pageUrl:string
}

const MetaTags = ({metaTags, macrosAndReplacements, pageUrl}: Iprops ) => {

    const fixedProperties = metaTags.properties.map((property: { property: string, content: string }) => ({
        property: property.property,
        content: replaceMacros({stringWithMacros: property.content, macrosAndReplacements})
    }))
    const fixedNames = metaTags.names.map((name: { name: string, content: string }) => ({
        name: name.name,
        content: replaceMacros({stringWithMacros: name.content, macrosAndReplacements})
    }))
    const title = replaceMacros({stringWithMacros: metaTags.title, macrosAndReplacements})
    const canonical = pipe(
        pageUrl,
        url => removeSegmentsFromCanonical({url, removeParameters: window.config.canonicalRemovals}),
        removeStringAfterTheQuestionMark
    )
    return (
        <>
            <link rel="canonical" href={canonical}/>
            <title>{title}</title>
            {fixedNames && fixedNames.map((tag: { name: string, content: string }, index: number) => (
                <meta name={tag.name} content={tag.content} key={index}/>
            ))}
            {fixedProperties && fixedProperties.map((tag: { property: string, content: string }, index: number) => (
                <meta property={tag.property} content={tag.content} key={index}/>
            ))}
        </>
    )
}

export default MetaTags
