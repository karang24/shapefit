import sys
from pathlib import Path

MIN_PYTHON = (3, 12)
RECOMMENDED_PYTHON = (3, 12)
PYTHON_13 = (3, 13)

def check_python_version():
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version < MIN_PYTHON:
        print(f"\nERROR: Python {version.major}.{version.minor} is not supported.")
        print(f"Minimum required: Python {MIN_PYTHON[0]}.{MIN_PYTHON[1]}")
        sys.exit(1)

    if version >= PYTHON_13:
        print("\nNOTE: Python 3.13+ detected.")
        print("Please ensure requirements.txt uses: pillow>=10.4.0")
        print("You can update it by running:")
        print("  sed -i 's/pillow==10.1.0/pillow>=10.4.0/g' requirements.txt")

    if version == RECOMMENDED_PYTHON:
        print("\n✓ Using recommended Python version")

    print(f"\nCurrent version: {version.major}.{version.minor}")
    print(f"Recommended: {RECOMMENDED_PYTHON[0]}.{RECOMMENDED_PYTHON[1]}")

if __name__ == "__main__":
    check_python_version()
