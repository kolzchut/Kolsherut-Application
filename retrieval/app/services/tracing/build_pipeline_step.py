def build_pipeline_step(step_name: str, step_input, step_output, duration_ms: float) -> dict:
    return {
        'step': step_name,
        'input': step_input,
        'output': step_output,
        'duration_ms': duration_ms,
    }
