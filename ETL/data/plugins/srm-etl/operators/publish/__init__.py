from srm_tools.error_notifier import invoke_on

from .main import run_publish_pipeline

OPERATOR_NAME = 'Publish (SRM derive rewrite)'


def operator(*_, dump_directory=None):
    invoke_on(lambda: run_publish_pipeline(dump_directory), OPERATOR_NAME)


if __name__ == '__main__':
    operator()
