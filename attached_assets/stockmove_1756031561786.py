import pandas as pd
import math

# File paths
folder = r'D:\BACKUP\AI\PROCUREMENT APP FILES'
kievyan_file = f'{folder}\\KIEVYAN11.CSV'
sevan_file = f'{folder}\\SEVAN5.CSV'

# Read the files (case-insensitive headers, handle typical Excel/csv quirks)
kievyan = pd.read_csv(kievyan_file, encoding='utf-8-sig')
sevan = pd.read_csv(sevan_file, encoding='utf-8-sig')

# Standardize columns
kievyan.columns = [c.upper().strip() for c in kievyan.columns]
sevan.columns = [c.upper().strip() for c in sevan.columns]

# Build a dictionary of all product names (union of both files)
all_names = set(kievyan['NAME']).union(set(sevan['NAME']))

# Helper: determines optimal Kievyan11 quantity by rules
def get_kievyan_optimal(name, total_qty):
    name_lower = name.lower()
    def startswith(prefix): return name_lower.startswith(prefix.lower())

    # 0% (all in Sevan5)
    zero_prefixes = [
        "экран для проектора","шурупы","шкаф","стол","стул","патч-панель","кресло",
        "корпус racktower","кабельный ввод","компьютер cs"
    ]
    if any(startswith(pref) for pref in zero_prefixes):
        return 0

    # 1 piece only
    one_prefixes = [
        "сумка для ноутбука","принтер","проектор","ноутбук","монитор",
        "корпус miditower","корпус minitower","ибп ups"
    ]
    if any(startswith(pref) for pref in one_prefixes):
        return min(1, total_qty)

    # 10% (at least 1)
    ten_prefixes = [
        "шредер","кулер","кронштейн","колонки","коврик для мыши","картридж",
        "источник питания","инструмент","зарядное устройство","док-станция",
        "джойстик","держатель","графический планшет","батарейка","kvm-коммуникатор"
    ]
    if any(startswith(pref) for pref in ten_prefixes):
        return max(1, math.ceil(total_qty * 0.1))

    # 100%
    hundred_prefixes = [
        "компьютер led"
    ]
    if any(startswith(pref) for pref in hundred_prefixes):
        return total_qty

    # 20% (at least 1) for everything else
    return max(1, math.ceil(total_qty * 0.2))

# Prepare result list
rows = []

for name in sorted(all_names):
    kievyan_qty = int(kievyan[kievyan['NAME'] == name]['QTY'].sum()) if name in kievyan['NAME'].values else 0
    sevan_qty = int(sevan[sevan['NAME'] == name]['QTY'].sum()) if name in sevan['NAME'].values else 0
    total_qty = kievyan_qty + sevan_qty

    kievyan_optimal = get_kievyan_optimal(name, total_qty)
    sevan_optimal = total_qty - kievyan_optimal

    move_to_kievyan = max(0, kievyan_optimal - kievyan_qty)
    move_to_sevan = max(0, kievyan_qty - kievyan_optimal)

    rows.append({
        'NAME': name,
        'KIEVYAN11_CURRENT': kievyan_qty,
        'SEVAN5_CURRENT': sevan_qty,
        'KIEVYAN11_OPTIMAL': kievyan_optimal,
        'SEVAN5_OPTIMAL': sevan_optimal,
        'MOVE_TO_KIEVYAN11': move_to_kievyan,
        'MOVE_TO_SEVAN5': move_to_sevan,
    })

# Output
df_out = pd.DataFrame(rows)
df_out.to_csv(f'{folder}\\STOCK_MOVEMENT.csv', index=False, encoding='utf-8-sig')
print('STOCK_MOVEMENT.csv created!')
