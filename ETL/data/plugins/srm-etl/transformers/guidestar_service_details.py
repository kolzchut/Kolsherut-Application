import datetime

PAYMENT_MAPPING = {
    'Free service': ('no', None),
    None: ('no', None),
    'Symbolic cost': ('yes', 'עלות סמלית'),
    'Full payment': ('yes', 'השירות ניתן בתשלום'),
    'Government funded': ('yes', 'השירות מסובסד על ידי הממשלה'),
}
AREA_LABELS = {
    'Country wide': 'בתיאום מראש ברחבי הארץ',
    'Customer Place': 'בבית הלקוח',
    'Remote Service': 'שירות מרחוק',
    'Via Phone or Mail': 'במענה טלפוני, צ׳אט או בדוא"ל',
    'Web Service': 'בשירות אינטרנטי מקוון',
    'Customer Appointment': 'במפגשים קבוצתיים או אישיים',
    'Program': 'תוכנית ייעודית בהרשמה מראש',
}
WHEN_LABELS = {
    'All Year': 'השירות ניתן בכל השנה',
    'Requires Signup': 'השירות ניתן בהרשמה מראש',
    'Time Limited': 'השירות מתקיים בתקופה מוגבלת',
    'Criteria Based': 'השירות ניתן על פי תנאים או קריטריונים',
}
REMOTE_DELIVERY_LABELS = {
    'Phone': 'טלפון',
    'Chat / Email / Whatsapp': 'בצ׳אט, דוא"ל או וואטסאפ',
    'Internet': 'אתר אינטרנט',
    'Zoom / Hybrid': 'בשיחת זום',
}


def apply_payment(row, data):
    payment_required = data.pop('paymentMethod')
    assert payment_required in PAYMENT_MAPPING, str(payment_required) + ' ' + repr(row)
    row['payment_required'], row['payment_details'] = PAYMENT_MAPPING[payment_required]
    service_terms = data.pop('serviceTerms')
    if service_terms:
        if row.get('payment_details'):
            row['payment_details'] += ', ' + service_terms
        else:
            row['payment_details'] = service_terms


def build_area_details(row, data, actual_branch_ids):
    details, areas, national = [], [], False
    for item in (data.pop('area') or '').split(';'):
        if item == 'In Branches':
            areas.append('בסניפי הארגון')
            if len(row['branches']) == 0:
                row['branches'] = ['guidestar:' + branch_id for branch_id in actual_branch_ids]
        elif item in AREA_LABELS:
            areas.append(AREA_LABELS[item])
            national = True
        elif item in ('Not relevant', ''):
            pass
        else:
            assert False, 'area {}: {!r}'.format(item, row)
    if len(areas) > 1:
        details.append('השירות ניתן: ' + ', '.join(areas))
    elif len(areas) == 1:
        details.append('השירות ניתן ' + ''.join(areas))
    return details, national


def add_when_details(details, data, row):
    when = data.pop('whenServiceActive')
    if when is None:
        return
    assert when in WHEN_LABELS, 'when {}: {!r}'.format(when, row)
    details.append(WHEN_LABELS[when])


def add_remote_details(details, data):
    methods = []
    for item in (data.pop('remoteServiceDelivery') or '').split(';'):
        if item in REMOTE_DELIVERY_LABELS:
            methods.append(REMOTE_DELIVERY_LABELS[item])
        else:
            assert item in ('', 'Other'), 'remoteDelivery {!r}'.format(item)
    remote_delivery_other = data.pop('RemoteServiceDelivery_Other')
    if remote_delivery_other:
        methods.append(remote_delivery_other)
    if methods:
        details.append('שירות מרחוק באמצעות: ' + ', '.join(methods))


def add_date_details(details, data):
    for field_name, label in (('startDate', 'תאריך התחלה: '), ('endDate', 'תאריך סיום: ')):
        raw_date = data.pop(field_name, None)
        if raw_date:
            formatted = datetime.datetime.fromisoformat(raw_date[:19]).date().strftime('%d/%m/%Y')
            details.append(label + formatted)
