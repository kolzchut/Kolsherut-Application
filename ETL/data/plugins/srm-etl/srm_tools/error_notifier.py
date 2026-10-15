import datetime
import json
import smtplib
import sys
import traceback

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from conf import settings
from srm_tools.logger import logger

def report_failure_to_container_log(operation_name: str, error: str, is_test: bool = False):
    # Cronicle captures a job's stdout into its own job log, so a plain print never reaches
    # `kubectl logs` / Azure Container Insights. Write one JSON line to the container's stdout
    # (PID 1) instead; MONITORING.md documents how to query these lines by `event`.
    line = json.dumps({
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'level': 'error',
        'event': 'etl_job_failed_test' if is_test else 'etl_job_failed',
        'env': settings.ENV_NAME,
        'operation': operation_name,
        'error': error[-2000:],
    }, ensure_ascii=False)
    try:
        with open('/proc/1/fd/1', 'a') as container_stdout:
            container_stdout.write(line + '\n')
    except OSError:
        sys.stderr.write(line + '\n')

def send_failure_email(operation_name: str, error: str, is_test: bool = False,reraise: bool = True):
    report_failure_to_container_log(operation_name, error, is_test)
    ENV_NAME = settings.ENV_NAME
    SMTP_SERVER = settings.SMTP_SERVER
    SMTP_PORT = settings.SMTP_PORT
    SENDER_EMAIL = settings.EMAIL_NOTIFIER_SENDER_EMAIL
    SENDER_PASSWORD = settings.EMAIL_NOTIFIER_PASSWORD
    RECIPIENT_LIST = settings.EMAIL_NOTIFIER_RECIPIENT_LIST

    RECIPIENT_LIST.append(SENDER_EMAIL)
    if is_test:
        logger.info("send_failure_email triggered")
        logger.info(f"sender email: {SENDER_EMAIL}.")
        logger.info(f"recipient list: {RECIPIENT_LIST}.")
    
    subject = f"ETL Task - {ENV_NAME} : {operation_name} Failed"
    body = f"Operation `{operation_name}` encountered an error:\n\nError Log:\n{error}"

    # Create email message
    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = ", ".join(RECIPIENT_LIST)
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Authenticate
        server.sendmail(SENDER_EMAIL, RECIPIENT_LIST, msg.as_string())
        server.quit()
        logger.info(f"Email sent about {operation_name}.")
    except Exception as e:
        logger.info(f"Failed to send email: {e}, {SENDER_EMAIL}")
        raise Exception(f"Failed to send email:{e}. \nOperation {operation_name} encountered an error. \nERROR:{error}")
    
    if not is_test and reraise:
        raise # Re-raise the original exception


def invoke_on(func, name, is_test=False, on_success=None, on_failure=None):
    try:
        func()
        if on_success:
            on_success()
    except Exception as e:
        logger.info(f"Error in {name}: {e}")
        if on_failure:
            on_failure()
        send_failure_email(name, traceback.format_exc(), is_test)
    except BaseException as e:
        logger.info(f"BaseException caught: {e}")
        send_failure_email(name, traceback.format_exc(), is_test)
