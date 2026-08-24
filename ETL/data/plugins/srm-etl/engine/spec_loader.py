from pathlib import Path

import yaml

from engine.spec_files import resolve_file_references

SPECS_DIRECTORY = Path(__file__).resolve().parent.parent / 'specs'
REQUIRED_SPEC_KEYS = ('name', 'outputs')
REQUIRED_OUTPUT_KEYS = ('name', 'derive_from', 'columns')


def validate_spec(spec, spec_name):
    for required_key in REQUIRED_SPEC_KEYS:
        if required_key not in spec:
            raise ValueError(f'Spec "{spec_name}" is missing required key "{required_key}"')
    for output_spec in spec['outputs']:
        for required_key in REQUIRED_OUTPUT_KEYS:
            if required_key not in output_spec:
                raise ValueError(
                    f'Spec "{spec_name}" has an output missing required key "{required_key}"'
                )


def load_spec(spec_name):
    spec_path = SPECS_DIRECTORY / f'{spec_name}.yaml'
    if not spec_path.exists():
        raise FileNotFoundError(f'Spec file not found: {spec_path}')
    with open(spec_path, encoding='utf-8') as spec_file:
        spec = yaml.safe_load(spec_file)
    spec = resolve_file_references(spec, SPECS_DIRECTORY)
    validate_spec(spec, spec_name)
    return spec
