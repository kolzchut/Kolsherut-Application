import {Request} from "express";

export type Req = Request & {
    user?: string;
};

