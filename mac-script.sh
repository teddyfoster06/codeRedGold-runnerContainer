#!/bin/bash

# Get Host IP on Mac
HOST_IP=$(ipconfig getifaddr en0)

# Print for debugging
echo "Host IP detected: $HOST_IP"

# Run Docker container
docker run --name runner-attempt4 -e HOST_IP=$HOST_IP -p 3080:3080 runner-container2
