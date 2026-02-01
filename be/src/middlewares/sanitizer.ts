import {Request, Response, NextFunction} from "express";
import {replaceNestedValue} from "../utilities/objectController";

type FilterValue = {
    field: string;
    value: Array<string | number | boolean> | string | number | boolean;
    replacementValue: string | number | boolean;
}

const transformData = (body: any, fields: Array<FilterValue>) => {
    if (!body || !body.data) return;
    const newData = body.data;
    fields.forEach(({field, value, replacementValue}) => {
        const values = Array.isArray(value) ? value : [value];
        replaceNestedValue(newData, field, values, replacementValue);
    });
    body.data = newData;
}

export default (fields: Array<FilterValue> | FilterValue) => {
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    return (req: Request, res: Response, next: NextFunction) => {
        const originalJson = res.json.bind(res);
        res.json = function (body: any) {
            transformData(body, fieldArray);
            return originalJson(body);
        };
        next();
    };
}
