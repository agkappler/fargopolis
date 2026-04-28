#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
REQ_FILE="${ROOT_DIR}/infrastructure/lambdas/requirements-dev.txt"

if [[ ! -f "${REQ_FILE}" ]]; then
  echo "Missing requirements file: ${REQ_FILE}" >&2
  exit 1
fi

# Matches Lambda runtime + CDK local `pip install -t` (see infrastructure/lib/lambda-bundling-python.ts).
if ! command -v python3.12 >/dev/null 2>&1; then
  echo "python3.12 is required. Install e.g.:" >&2
  echo "  brew install python@3.12 && echo 'export PATH=\"/opt/homebrew/opt/python@3.12/bin:\$PATH\"' >> ~/.zshrc" >&2
  exit 1
fi

PYTHON_BIN="$(command -v python3.12)"

echo "Using Python: ${PYTHON_BIN} ($("${PYTHON_BIN}" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'))"
echo "Creating virtual environment at ${VENV_DIR}"
"${PYTHON_BIN}" -m venv "${VENV_DIR}"

echo "Upgrading pip"
"${VENV_DIR}/bin/python" -m pip install --upgrade pip

echo "Installing Lambda local dependencies from ${REQ_FILE}"
"${VENV_DIR}/bin/python" -m pip install -r "${REQ_FILE}"

cat <<EOF

Done.
Activate with:
  source .venv/bin/activate

Then in Cursor/VS Code:
  Python: Select Interpreter -> ${VENV_DIR}/bin/python

For \`npx cdk deploy\` / \`npx cdk synth\` (local Lambda asset bundling), keep python3.12 on your PATH — see README.md → Machine setup.
EOF
