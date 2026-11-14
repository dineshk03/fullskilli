# Test PID Login Flow
Write-Host "Testing PID Login for PID 411..."

# The PID login token from the earlier generation
$pidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOiI0MTEiLCJpYXQiOjE3NjEzNjgwMDcsImV4cCI6MTc2MTM3MTYwN30.ZgR7ETLuXnLxFDyO9iTWqLQys7AKv1Rgmj7kf_av_ew"

# Test the PID login API
$body = @{
    pid = "411"
    token = $pidToken
} | ConvertTo-Json

Write-Host "Request body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/v1/auth/login-by-pid" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success: PID Login successful!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
    
    # Generate the frontend URL
    $frontendUrl = "http://localhost:5173/pid-login?pid=411&token=$pidToken"
    Write-Host ""
    Write-Host "Frontend URL to test:"
    Write-Host $frontendUrl
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
