#!/bin/bash
# Crammer+ Backend Startup Script

echo "Starting Crammer+ Backend..."

# Set Python path
export PYTHONPATH="${PWD}"

# Run the application
python -m app.main
