# Get the host's IPv4 address excluding Docker interfaces
$HOST_IP = (Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object { $_.IPAddress -notlike '127.*' -and $_.InterfaceAlias -notlike 'vEthernet*' } |
            Select-Object -First 1 -ExpandProperty IPAddress)

# Print for debugging
Write-Host "Host IP detected: $HOST_IP"

# Run Docker container
docker run --name runner-attempt7 -e HOST_IP=$HOST_IP -p 3080:3080 runner-container2
