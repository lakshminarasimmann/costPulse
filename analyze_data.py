import csv
from collections import Counter

with open('data/shipment_records.csv', 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f'Total records: {len(rows)}')
print(f'Columns: {list(rows[0].keys())}')

routes = Counter(r['origin'] + '-' + r['destination'] for r in rows)
print(f'\nRoutes ({len(routes)}):')
for route, count in sorted(routes.items()):
    rt = [r['route_type'] for r in rows if r['origin'] + '-' + r['destination'] == route][0]
    print(f'  {route} ({rt}): {count} shipments')

types = Counter(r['route_type'] for r in rows)
print(f'\nRoute types: {dict(types)}')

dates = sorted(set(r['shipment_date'] for r in rows))
print(f'\nDate range: {dates[0]} to {dates[-1]}')
print(f'Total unique dates: {len(dates)}')

materials = Counter(r['material'] for r in rows)
print(f'\nMaterials: {dict(materials)}')

transporters = Counter(r['transporter'] for r in rows)
print(f'\nTransporters: {dict(transporters)}')

# Check route_type mapping
route_types = {}
for r in rows:
    route = r['origin'] + '-' + r['destination']
    rt = r['route_type']
    if route not in route_types:
        route_types[route] = set()
    route_types[route].add(rt)
print(f'\nRoute to type mapping:')
for route, types_set in sorted(route_types.items()):
    print(f'  {route}: {types_set}')
