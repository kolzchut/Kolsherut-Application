from time import perf_counter
from typing import Awaitable


async def time_async_call(awaitable: Awaitable) -> tuple:
    started_at = perf_counter()
    result = await awaitable
    return result, (perf_counter() - started_at) * 1000
