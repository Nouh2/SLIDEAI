import re
import os

# Define the path to the file
file_path = r'C:\Users\noete\Desktop\SLIDEAI\Frontend\presto-decks\src\components\slides\ModernSlideRenderer.tsx'

# Define the mappings (Old -> New)
# We want a ~2 step jump.
# Order matters: Largest to smallest to avoid replacing a replaced value if we were just incrementing numbers,
# but here we are jumping significantly. 
# However, to be absolutely safe and clear, we process from specific keys.
# We will read the whole file, then engage a series of replacements.
# Note: "text-base" is a bit tricky because it doesn't end in a number, but `text-xl` does.
# We must ensure we don't accidentally match parts of other strings, so we'll use word boundaries `\b`.

# Mapping based on "grossir quand meme pas mal" (+2 steps roughly)
# 7xl -> 9xl
# 6xl -> 8xl
# 5xl -> 7xl
# 4xl -> 6xl
# 3xl -> 5xl
# 2xl -> 4xl
# xl  -> 3xl
# lg  -> 2xl
# base -> xl (jumping lg)
# sm  -> lg (jumping base)
# xs  -> base (jumping sm)

replacements = [
    (r'\btext-7xl\b', 'text-9xl'),
    (r'\btext-6xl\b', 'text-8xl'),
    (r'\btext-5xl\b', 'text-7xl'),
    (r'\btext-4xl\b', 'text-6xl'),
    (r'\btext-3xl\b', 'text-5xl'),
    (r'\btext-2xl\b', 'text-4xl'),
    (r'\btext-xl\b', 'text-3xl'),
    (r'\btext-lg\b', 'text-2xl'),
    (r'\btext-base\b', 'text-xl'),
    (r'\btext-sm\b', 'text-lg'),
    (r'\btext-xs\b', 'text-base'),
]

def update_font_sizes():
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    print("Starting replacements...")
    
    # We need to be careful. If we replace `text-xl` with `text-3xl`, and then later replace `text-3xl` with `text-5xl`,
    # we might double-jump if we are not careful about the order. 
    # Current list order:
    # 7xl -> 9xl
    # 6xl -> 8xl 
    # 5xl -> 7xl (Safe: 7xl was already processed/renamed to 9xl in step 1, so the new 7xl won't be matched by step 1 matching 7xl)
    # ...
    # xl -> 3xl (Safe: 3xl was handled in step 5)
    
    # So iterating from LARGEST original size to SMALLEST original size is the safe way.
    # The list `replacements` is already ordered 7xl -> xs.

    for pattern, replacement in replacements:
        # verifying count before
        count = len(re.findall(pattern, content))
        if count > 0:
            content = re.sub(pattern, replacement, content)
            print(f"Replaced {count} instances of {pattern} with {replacement}")
        else:
            print(f"No instances found for {pattern}")

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("File updated successfully.")
    else:
        print("No changes made.")

if __name__ == "__main__":
    update_font_sizes()
