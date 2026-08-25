from engine.api_runner import run_apis
from engine.outputs import load_output
from engine.pipeline import build_output, build_spec_context
from engine.spec_loader import load_spec
from load.airtable_values import raise_if_batches_failed
from srm_tools.error_notifier import invoke_on
from srm_tools.logger import logger


def run(spec_name):
    logger.info(f'Running spec "{spec_name}"')
    spec = load_spec(spec_name)
    fetched_frames = run_apis(spec.get('apis'))
    context = build_spec_context(spec)
    built_outputs = {}
    load_errors = []
    # Build and load one output at a time: a later output's Airtable-reading
    # transforms (e.g. foreign-key resolution) must see earlier outputs' loads.
    for output_spec in spec['outputs']:
        frame = build_output(output_spec, fetched_frames, built_outputs, spec, context)
        built_outputs[output_spec['name']] = frame
        load_errors.extend(load_output(frame, output_spec))
    logger.info(f'Finished spec "{spec_name}"')
    # Raised only after every output had its chance to load, so one bad batch cannot starve the rest.
    raise_if_batches_failed(load_errors, 'load')


def operator(spec_name):
    invoke_on(lambda: run(spec_name), spec_name)
