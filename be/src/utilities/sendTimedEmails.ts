import {sendEmail} from "../services/email/emailService";
import vars from "../vars";
import logger from "../services/logger/logger";

const globals: {
    lastEmailSentAt: number, emailInterval: number,
    stack: Array<string>, isSending: boolean
} = {
    lastEmailSentAt: Date.now(),
    emailInterval: vars.email.EMAIL_INTERVAL_HOURS *(60 * 60 * 1000), // convert hours to milliseconds
    stack: [],
    isSending: false
}

let interval: NodeJS.Timeout | null = null;

const startInterval = () => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        if (!globals.stack.length) return;
        sendTimedEmails({hasError:false}).catch(e =>
            logger.error({service: "sendTimedEmails", message: "Interval email failed", payload: e})
        );
    }, globals.emailInterval);
};

startInterval();

const sendEmailWhenNoResults = ({fixedSearchQuery, responseId, situationId, by}: {
    fixedSearchQuery: string,
    responseId?: string,
    situationId?: string,
    by?: string
}) => {
    return globals.stack.push(`No results for searchQuery: "${fixedSearchQuery}"\nresponseId: "${responseId || ''}"\nsituationId: "${situationId || ''}"\nby: "${by || ''}"`);
}
const sendErrorEmailImmediately = (body:string)=>{
    globals.stack.unshift(body);
    sendTimedEmails({hasError:true}).catch(e =>
        logger.error({service: "sendTimedEmails", message: "Immediate error email failed", payload: e})
    );
}

const sendTimedEmails = async ({hasError}:{hasError: boolean}) => {
    if (!globals.stack.length || globals.isSending) return;
    globals.isSending = true;
    let body = globals.stack.map((item, index) => `${index + 1}. ${item}`).join("\n");

    try {
        await sendEmail({
            subject: `Kolsherut ${vars.serverSetups.environment} - ${hasError ? 'Error and ' : ''}${globals.stack.length} Notification${globals.stack.length > 1 ? 's' : ''}`,
            body: body
        });
        globals.lastEmailSentAt = Date.now();
        globals.stack = [];
        startInterval();
    } catch (e) {
        logger.error({service: "sendTimedEmails", message: "Failed to send timed email", payload: e});
    } finally {
        globals.isSending = false;
    }
}

export {sendEmailWhenNoResults, sendErrorEmailImmediately}
