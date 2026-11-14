$body = @{
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlhdCI6MTc2MTM2ODAwNywiZXhwIjoxNzYxMzcxNjA3fQ.L4bHMV90IouP4Rq_ifGNsaMcz0I3aDCSgvAtN71RHco"
    email = "testuser@example.com"
    firstName = "Test"
    lastName = "User"
    phone = "+91 9876543210"
    pid = "411"
} | ConvertTo-Json

Write-Host "Creating user with PID 411..."
Write-Host "Request body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/v1/auth/external-sso-login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success: User created successfully!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
