import nodemailer, { Transporter } from 'nodemailer';
import logger from "../logger/logger";
import vars from "../../vars";

let transporter: Transporter | null = null;
const env = vars.serverSetups.environment;

export function initEmailService() {
    if(!vars.email.EMAIL_NOTIFIER_SENDER_EMAIL || !vars.email.EMAIL_NOTIFIER_PASSWORD || !vars.email.EMAIL_NOTIFIER_RECIPIENT_LIST.length) {
        logger.log({ service: "Email Service", message: 'Email service not initialized due to missing configuration.' });
        return;
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: vars.email.SMTP_SERVER,
            port: vars.email.SMTP_PORT,
            secure: false,
            auth: {
                user: vars.email.EMAIL_NOTIFIER_SENDER_EMAIL,
                pass: vars.email.EMAIL_NOTIFIER_PASSWORD,
            },
        });
        logger.log({ service: "Email Service", message: 'Email service initialized.' });
        if (env !== "prod") return;
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        setInterval(() => {
            sendEmail({
                subject: `Kolsherut ${env} - Keep Alive`,
                body: "This is a weekly keep-alive email from the backend of Kolsherut."
            }).catch(err => logger.error({ service: "Email Service", message: "Failed to send keep-alive email", payload: err }));
        }, oneWeekMs);
    }
}

export async function sendEmail({subject, body,additionalRecipientList}:{
    subject: string,
    body: string,
    additionalRecipientList?: string[]}
): Promise<void> {
    try {
        if (!transporter) return;

        const recipients = additionalRecipientList
            ? [...additionalRecipientList, vars.email.EMAIL_NOTIFIER_SENDER_EMAIL]
            : vars.email.EMAIL_NOTIFIER_RECIPIENT_LIST.concat(vars.email.EMAIL_NOTIFIER_SENDER_EMAIL || "");

        await transporter.sendMail({
            from: vars.email.EMAIL_NOTIFIER_SENDER_EMAIL,
            to: recipients.join(', '),
            subject,
            text: body,
        });
        logger.log({service:"Email Service", message:`Email sent`,payload: subject});
    } catch (err) {
        logger.error({service:"Email Service", message:`Failed to send email:` ,payload: err});
    }
}
