#!/bin/bash
# Wrapper script to run conversion_utils.py with python3.11
exec /usr/bin/python3.11 "$(dirname "$0")/conversion_utils.py" "$@"
