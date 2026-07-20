from app.services.generation.build_context_text import build_context_text
from app.services.tracing.build_pipeline_step import build_pipeline_step
from app.strings import PIPELINE_STEP_LLM
from app.vars import LLM_MODEL_NAME


def build_llm_step(prompt: str, documents: list[dict], answer: str, duration_ms: float) -> dict:
    step_input = {
        'model': LLM_MODEL_NAME,
        'prompt': prompt,
        'context_text': build_context_text(documents),
    }
    return build_pipeline_step(PIPELINE_STEP_LLM, step_input, answer, duration_ms)
