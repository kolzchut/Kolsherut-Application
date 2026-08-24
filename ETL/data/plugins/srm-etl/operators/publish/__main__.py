import argparse

from operators.publish import operator

ARGUMENT_PARSER_DESCRIPTION = 'Run the SRM publish pipeline'
DUMP_DIR_HELP = 'Write the in-memory stage outputs to this directory for debugging'


def parse_arguments():
    parser = argparse.ArgumentParser(description=ARGUMENT_PARSER_DESCRIPTION)
    parser.add_argument('--dump-dir', default=None, help=DUMP_DIR_HELP)
    return parser.parse_args()


arguments = parse_arguments()
operator(dump_directory=arguments.dump_dir)
