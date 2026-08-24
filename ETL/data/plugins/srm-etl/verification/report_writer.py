"""Timestamped human-readable reports for every verification check.

A check never passes or fails - it writes a summary (counts) plus a field-level
detail file, and a human reads the report and decides.
"""
import json
import os
from datetime import datetime

REPORTS_DIRECTORY = os.path.join(os.path.dirname(__file__), 'reports')
TIMESTAMP_FORMAT = '%Y%m%d-%H%M%S'


def write_report(check_name, summary_lines, detail_payload):
    os.makedirs(REPORTS_DIRECTORY, exist_ok=True)
    timestamp = datetime.now().strftime(TIMESTAMP_FORMAT)
    summary_path = os.path.join(REPORTS_DIRECTORY, f'{check_name}-{timestamp}.txt')
    detail_path = os.path.join(REPORTS_DIRECTORY, f'{check_name}-{timestamp}-detail.json')
    with open(summary_path, 'w', encoding='utf-8') as summary_file:
        summary_file.write('\n'.join(summary_lines) + '\n')
    with open(detail_path, 'w', encoding='utf-8') as detail_file:
        json.dump(detail_payload, detail_file, ensure_ascii=False, indent=2, default=str)
    for line in summary_lines:
        print(line)
    print(f'Summary: {summary_path}')
    print(f'Detail:  {detail_path}')
    return summary_path


def diff_summary_lines(check_name, diff_summary):
    return [
        f'{check_name} report',
        f"  identical:   {diff_summary['identical']}",
        f"  changed:     {diff_summary['changed']}",
        f"  only-legacy: {diff_summary['only_legacy']}",
        f"  only-new:    {diff_summary['only_new']}",
    ]
