import fs from 'fs';
import vars from "../../vars";
import path from "path";

const logsDir = vars.logs.loggerFolderPath;
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}
let fullPath = path.join(logsDir,`Logs_${Math.floor(Date.now()/1000)}.txt`);
setInterval(() => {fullPath= path.join(logsDir,`Logs_${Math.floor(Date.now()/1000)}.txt`);},vars.logs.logDuration);



const logToFile = ({service, content}: {service: string, content: { message: string, payload?: any }}) => {
    const data = `${new Date().toISOString()} - ${service} \n  ${JSON.stringify(content, null, 2)}\n\n`;
    fs.appendFile(fullPath, data, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};

export default logToFile;
