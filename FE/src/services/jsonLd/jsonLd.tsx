import {replaceMacros} from "../str";

interface IProps {
    templates: any[];
    macrosAndReplacements: { [key: string]: string };
    objectReplacements?: { [key: string]: any };
}

const JsonLd = ({templates, macrosAndReplacements, objectReplacements = {}}: IProps) => {
    const processedSchemas = templates.map((template) => {
        let jsonString = JSON.stringify(template);

        jsonString = replaceMacros({
            stringWithMacros: jsonString,
            macrosAndReplacements
        });

        let schema = JSON.parse(jsonString);

        schema = replaceObjectMacros(schema, objectReplacements);

        return schema;
    });

    return (
        <>
            {processedSchemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
                />
            ))}
        </>
    );
};

const replaceObjectMacros = (obj: any, objectReplacements: { [key: string]: any }): any => {
    if (typeof obj === "string") {
        return objectReplacements[obj] !== undefined ? objectReplacements[obj] : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => replaceObjectMacros(item, objectReplacements));
    }
    if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = replaceObjectMacros(value, objectReplacements);
        }
        return result;
    }
    return obj;
}

export default JsonLd;
