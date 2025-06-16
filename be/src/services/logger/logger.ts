import vars from "../../vars";
import logToFile from "./logToFile";

export default {
  log:({service, message,payload}:{service:string,message:string, payload?:any}) =>{
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}});
    if(!vars.logs.verbose) return;
    console.log(`${new Date().toISOString()} - ${service} \n  ${message}\n\n ${payload ? JSON.stringify(payload): '' } \n\n\n`);
  },
  logAlways:({service, message,payload}:{service:string,message:string, payload?:any}) => {
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}})
    console.log(`${new Date().toISOString()} - ${service} \n  ${message}\n\n`)
  },
  warning: ({service, message,payload}:{service:string,message:string, payload?:any}) => {
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}})
    console.warn(`${new Date().toISOString()} - ${service} \n  ${message}\n\n`)
  },
  error:({service, message,payload}:{service:string,message:string, payload?:any}) => {
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}})
    console.error(`${new Date().toISOString()} - ${service} \n  ${message}\n\n`)
  },
};
