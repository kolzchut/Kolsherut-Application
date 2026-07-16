import pandas as pd

def drop_marked_as_false_by_revaha(program_texts_df: pd.DataFrame) -> pd.DataFrame:
    # This function removes rows where marked_as_false_by_revaha = X
    program_texts_df = program_texts_df[program_texts_df['marked_as_false_by_revaha'] != 'X']
    return program_texts_df
