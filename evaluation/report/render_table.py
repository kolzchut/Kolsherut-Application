from evaluation.strings import OVERALL_SCORE_LINE, META_LINE_TEMPLATE


def format_cell(value) -> str:
    return value if isinstance(value, str) else f'{value:.4f}'


def format_row(row: list, column_widths: list[int]) -> str:
    cells = [format_cell(value).ljust(width) for value, width in zip(row, column_widths)]
    return ' | '.join(cells)


def compute_column_widths(headers: list[str], rows: list[list]) -> list[int]:
    all_rows = [headers, *[[format_cell(value) for value in row] for row in rows]]
    return [max(len(str(row[column])) for row in all_rows) for column in range(len(headers))]


def render_table(table: dict, overall_score: float, meta: dict) -> str:
    """Human-readable console block: overall score, run meta, and the metric x k grid."""
    column_widths = compute_column_widths(table['headers'], table['rows'])
    header_line = format_row(table['headers'], column_widths)
    separator = '-' * len(header_line)
    body_lines = [format_row(row, column_widths) for row in table['rows']]
    top_lines = [OVERALL_SCORE_LINE.format(score=overall_score), META_LINE_TEMPLATE.format(**meta), '']
    return '\n'.join([*top_lines, header_line, separator, *body_lines])
