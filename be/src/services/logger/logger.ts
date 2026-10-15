import vars from "../../vars";
import logToFile from "./logToFile";

type LogParams = {service:string,message:string, payload?:any};
type Level = 'info' | 'warning' | 'error';

// Error's own fields are non-enumerable, so JSON.stringify(error) would print {}.
const serializePayload = (payload: any) =>
  payload instanceof Error ? {name: payload.name, message: payload.message, stack: payload.stack} : payload;

// One JSON object per line, so Azure Container Insights stores each entry as a single
// ContainerLogV2 record with queryable fields (LogMessage.level, LogMessage.service, ...).
const writeLine = (level: Level, write: (line: string) => void, {service, message, payload}: LogParams) => {
  const entry: Record<string, any> = {timestamp: new Date().toISOString(), level, service, message};
  if (payload !== undefined) entry.payload = serializePayload(payload);
  try {
    write(JSON.stringify(entry));
  } catch {
    // Circular / non-serializable payload
    write(JSON.stringify({...entry, payload: String(payload)}));
  }
};

export default {
  log:({service, message,payload}:LogParams) =>{
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}});
    if(!vars.logs.verbose) return;
    writeLine('info', console.log, {service, message, payload});
  },
  logAlways:({service, message,payload}:LogParams) => {
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}})
    writeLine('info', console.log, {service, message, payload});
  },
  warning: ({service, message,payload}:LogParams) => {
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}})
    writeLine('warning', console.warn, {service, message, payload});
  },
  error:({service, message,payload}:LogParams) => {
    if (vars.logs.logToFile) logToFile({service, content:{message,payload}})
    writeLine('error', console.error, {service, message, payload});
  },
};
