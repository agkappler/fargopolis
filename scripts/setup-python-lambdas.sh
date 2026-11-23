#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
REQ_FILE="${ROOT_DIR}/infrastructure/lambdas/requirements-dev.txt"

if [[ ! -f "${REQ_FILE}" ]]; then
  echo "Missing requirements file: ${REQ_FILE}" >&2
  exit 1
fi

# The Lambda runtime version, pinned in /.python-version (see infrastructure/lib/lambda-python.ts).
PY_VERSION="$(tr -d '[:space:]' < "${ROOT_DIR}/.python-version")"
if ! command -v "python${PY_VERSION}" >/dev/null 2>&1; then
  echo "python${PY_VERSION} is required (pinned in .python-version). Install e.g.:" >&2
  echo "  brew install python@${PY_VERSION}" >&2
  exit 1
fi

PYTHON_BIN="$(command -v "python${PY_VERSION}")"

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

\`npx cdk deploy\` / \`npx cdk synth\` bundle Lambda assets with this .venv's Python (no Docker needed).
EOF
