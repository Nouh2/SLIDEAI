import json
import os

def fix_mojibake(text):
    if not isinstance(text, str):
        return text
    replacements = {
        'Â©': '©',
        'ðŸŽ‰': '🎉',
        'â†’': '→',
        'â€“': '–',
        'âœ“': '✓',
        'â†–': '↖',
        'â†—': '↗',
        'â†™': '↙',
        'â†˜': '↘',
        'â­ ': '⭐',
        'ðŸ †': '🏆',
        'ðŸ”’': '🔒',
        'ðŸ“Š': '📊',
        'ðŸŽ¨': '🎨',
        'â€¢': '•',
        'âœ¨': '✨',
        'ðŸš€': '🚀',
        'â‚¬': '€' # This is what the user saw for pricing
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text

def process_dict(d):
    for k, v in list(d.items()):
        if isinstance(v, dict):
            process_dict(v)
        elif isinstance(v, str):
            d[k] = fix_mojibake(v)
        elif isinstance(v, list):
            d[k] = [fix_mojibake(i) if isinstance(i, str) else i for i in v]

for file_path in ['src/locales/fr.json', 'src/locales/en.json']:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    process_dict(data)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Fixed {file_path}")

