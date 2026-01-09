#!/bin/bash

# Create organization first
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corporation"}'

echo "\nOrganization created! Use the returned ID in the next step."
