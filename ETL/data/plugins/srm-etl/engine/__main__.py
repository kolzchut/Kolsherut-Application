import logging
import sys

from engine.run_spec import operator

LOG_FORMAT = '%(asctime)s %(levelname)s %(name)s: %(message)s'

if __name__ == '__main__':
    # Only attach a handler when nothing (Airflow/Cronicle) configured logging already.
    if not logging.getLogger().handlers:
        logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
    operator(sys.argv[1])
