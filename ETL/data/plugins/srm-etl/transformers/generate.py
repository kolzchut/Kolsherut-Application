import datetime

GENERATORS = {
    'today': lambda: datetime.date.today().isoformat(),
}
