<?php
/**
 * Skilli Jobs to Beeja LMS SSO Integration
 * 
 * This file demonstrates how to integrate Skilli Jobs (PHP) with Beeja LMS (Node.js)
 * using JWT-based SSO authentication.
 * 
 * Requirements:
 * - composer require firebase/php-jwt
 */

require_once 'vendor/autoload.php';
use Firebase\JWT\JWT;

class BeejaLMSIntegration
{

    private $ssoSecret;
    private $lmsApiUrl;
    private $lmsFrontendUrl;

    /**
     * Constructor
     */
    public function __construct()
    {
        // These should match the values in Beeja LMS backend .env
        $this->ssoSecret = 'skilli_jobs_beeja_lms_shared_secret_key_2024';
        $this->lmsApiUrl = 'http://localhost:5001/api/v1';
        $this->lmsFrontendUrl = 'http://localhost:5173';
    }

    /**
     * Generate SSO Token for user authentication
     * 
     * @param int $pid User's PID (Person ID)
     * @param string $email User's email
     * @param string $name User's full name
     * @return string JWT token
     */
    public function generateSSOToken($pid, $email, $name)
    {
        $payload = [
            'pid' => (string) $pid,
            'email' => $email,
            'name' => $name,
            'exp' => time() + (10 * 60), // Token expires in 10 minutes
            'iat' => time() // Issued at
        ];

        return JWT::encode($payload, $this->ssoSecret, 'HS256');
    }

    /**
     * Method 1: Direct API Login (Returns JWT token)
     * Use this when you want to handle the redirect yourself
     * 
     * @param int $pid User's PID
     * @param string $email User's email
     * @param string $name User's full name
     * @return array Response with JWT token and user data
     */
    public function loginByPID($pid, $email, $name)
    {
        $ssoToken = $this->generateSSOToken($pid, $email, $name);

        $ch = curl_init($this->lmsApiUrl . '/login-by-pid');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'pid' => (string) $pid,
            'token' => $ssoToken
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);

        if ($httpCode === 200 && $result['success']) {
            return [
                'success' => true,
                'jwtToken' => $result['token'],
                'user' => $result['user']
            ];
        } else {
            return [
                'success' => false,
                'message' => $result['message'] ?? 'Login failed'
            ];
        }
    }

    /**
     * Method 2: Direct Browser Redirect (Recommended)
     * Use this to redirect user directly to LMS with authentication
     * 
     * @param int $pid User's PID
     * @param string $email User's email
     * @param string $name User's full name
     * @param string $redirectPath Optional path to redirect after login (e.g., '/courses')
     */
    public function redirectToLMS($pid, $email, $name, $redirectPath = '/dashboard/my-profile')
    {
        $ssoToken = $this->generateSSOToken($pid, $email, $name);

        // Build redirect URL
        $params = http_build_query([
            'pid' => $pid,
            'token' => $ssoToken,
            'redirect' => $redirectPath
        ]);

        $redirectUrl = $this->lmsApiUrl . '/pid-login?' . $params;

        // Redirect user
        header('Location: ' . $redirectUrl);
        exit;
    }

    /**
     * Method 3: External SSO Login (More detailed)
     * Use this when you need to pass additional user information
     * 
     * @param array $userData User data array
     * @return array Response with JWT token and user data
     */
    public function externalSSOLogin($userData)
    {
        $ssoToken = $this->generateSSOToken(
            $userData['pid'],
            $userData['email'],
            $userData['name']
        );

        $ch = curl_init($this->lmsApiUrl . '/external-sso-login');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'token' => $ssoToken,
            'email' => $userData['email'],
            'firstName' => $userData['firstName'] ?? '',
            'lastName' => $userData['lastName'] ?? '',
            'pid' => (string) $userData['pid'],
            'phone' => $userData['phone'] ?? '',
            'courseId' => $userData['courseId'] ?? null
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);

        if ($httpCode === 200 && $result['success']) {
            return [
                'success' => true,
                'jwtToken' => $result['token'],
                'user' => $result['user'],
                'redirectUrl' => $result['redirectUrl'],
                'isNewUser' => $result['isNewUser']
            ];
        } else {
            return [
                'success' => false,
                'message' => $result['message'] ?? 'SSO login failed'
            ];
        }
    }

    /**
     * Check if user exists in LMS
     * 
     * @param int $pid User's PID
     * @return bool True if user exists
     */
    public function checkUserExists($pid)
    {
        $ch = curl_init($this->lmsApiUrl . '/check-user-by-pid?pid=' . $pid);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);

        return $result['exists'] ?? false;
    }

    /**
     * Generate frontend redirect URL with JWT token
     * 
     * @param string $jwtToken JWT token from LMS
     * @param string $path Path to redirect to
     * @return string Full redirect URL
     */
    public function getFrontendRedirectUrl($jwtToken, $path = '/dashboard/my-profile')
    {
        return $this->lmsFrontendUrl . $path . '?token=' . urlencode($jwtToken);
    }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Simple redirect to LMS (Recommended for "Upskill" button)
 */
function example1_simpleRedirect()
{
    // Assume you have the user data from your session/database
    $user = [
        'pid' => 12345,
        'email' => 'john.doe@example.com',
        'name' => 'John Doe'
    ];

    $lms = new BeejaLMSIntegration();

    // This will redirect the user to LMS with authentication
    $lms->redirectToLMS(
        $user['pid'],
        $user['email'],
        $user['name'],
        '/courses' // Redirect to courses page after login
    );
}

/**
 * Example 2: API-based login with custom handling
 */
function example2_apiLogin()
{
    $user = [
        'pid' => 12345,
        'email' => 'john.doe@example.com',
        'name' => 'John Doe'
    ];

    $lms = new BeejaLMSIntegration();

    // Login via API
    $result = $lms->loginByPID(
        $user['pid'],
        $user['email'],
        $user['name']
    );

    if ($result['success']) {
        // You now have the JWT token
        $jwtToken = $result['jwtToken'];
        $userData = $result['user'];

        // You can:
        // 1. Store the token in session
        $_SESSION['lms_jwt_token'] = $jwtToken;

        // 2. Redirect to frontend with token
        $redirectUrl = $lms->getFrontendRedirectUrl($jwtToken, '/courses');
        header('Location: ' . $redirectUrl);
        exit;
    } else {
        echo "Login failed: " . $result['message'];
    }
}

/**
 * Example 3: External SSO with additional data
 */
function example3_externalSSO()
{
    $user = [
        'pid' => 12345,
        'email' => 'john.doe@example.com',
        'name' => 'John Doe',
        'firstName' => 'John',
        'lastName' => 'Doe',
        'phone' => '+1234567890',
        'courseId' => 'course_123' // Optional: specific course to redirect to
    ];

    $lms = new BeejaLMSIntegration();

    $result = $lms->externalSSOLogin($user);

    if ($result['success']) {
        // User is authenticated
        $jwtToken = $result['jwtToken'];
        $redirectUrl = $result['redirectUrl'];
        $isNewUser = $result['isNewUser'];

        if ($isNewUser) {
            // This is a new user, you might want to show a welcome message
            $_SESSION['show_welcome'] = true;
        }

        // Redirect to LMS
        header('Location: ' . $redirectUrl);
        exit;
    } else {
        echo "SSO login failed: " . $result['message'];
    }
}

/**
 * Example 4: Check if user exists before redirecting
 */
function example4_checkUserExists()
{
    $pid = 12345;

    $lms = new BeejaLMSIntegration();

    if ($lms->checkUserExists($pid)) {
        echo "User exists in LMS";
        // Proceed with login
    } else {
        echo "User does not exist in LMS";
        // Create user first or show message
    }
}

/**
 * Example 5: Integration in existing Skilli Jobs controller
 */
class CandidateController
{

    public function upskillButton()
    {
        // Get current logged-in user
        $user = Auth::user(); // Laravel example

        // Initialize LMS integration
        $lms = new BeejaLMSIntegration();

        // Redirect to LMS
        $lms->redirectToLMS(
            $user->id,           // PID
            $user->email,        // Email
            $user->name,         // Full name
            '/courses'           // Redirect to courses page
        );
    }

    public function enrollInCourse($courseId)
    {
        $user = Auth::user();
        $lms = new BeejaLMSIntegration();

        // Redirect to specific course
        $lms->redirectToLMS(
            $user->id,
            $user->email,
            $user->name,
            '/courses/' . $courseId
        );
    }
}

// ============================================================================
// BLADE TEMPLATE EXAMPLES
// ============================================================================

/**
 * In your Blade template (e.g., candidate_dashboard.blade.php):
 * 
 * <a href="{{ route('lms.upskill') }}" class="btn btn-primary">
 *     <i class="fas fa-graduation-cap"></i> Upskill Now
 * </a>
 * 
 * In routes/web.php:
 * 
 * Route::get('/lms/upskill', [CandidateController::class, 'upskillButton'])
 *     ->name('lms.upskill')
 *     ->middleware('auth');
 */

// ============================================================================
// TESTING
// ============================================================================

/**
 * Test the integration
 */
function testIntegration()
{
    $lms = new BeejaLMSIntegration();

    // Test data
    $testUser = [
        'pid' => 99999,
        'email' => 'test@example.com',
        'name' => 'Test User'
    ];

    echo "Testing Beeja LMS Integration...\n\n";

    // Test 1: Generate SSO Token
    echo "1. Generating SSO Token...\n";
    $ssoToken = $lms->generateSSOToken(
        $testUser['pid'],
        $testUser['email'],
        $testUser['name']
    );
    echo "   ✓ SSO Token: " . substr($ssoToken, 0, 50) . "...\n\n";

    // Test 2: Check if user exists
    echo "2. Checking if user exists...\n";
    $exists = $lms->checkUserExists($testUser['pid']);
    echo "   " . ($exists ? "✓" : "✗") . " User exists: " . ($exists ? "Yes" : "No") . "\n\n";

    // Test 3: Login by PID
    echo "3. Testing login by PID...\n";
    $result = $lms->loginByPID(
        $testUser['pid'],
        $testUser['email'],
        $testUser['name']
    );

    if ($result['success']) {
        echo "   ✓ Login successful!\n";
        echo "   ✓ JWT Token: " . substr($result['jwtToken'], 0, 50) . "...\n";
        echo "   ✓ User ID: " . $result['user']['_id'] . "\n";
        echo "   ✓ Email: " . $result['user']['email'] . "\n";
    } else {
        echo "   ✗ Login failed: " . $result['message'] . "\n";
    }

    echo "\nIntegration test complete!\n";
}

// Uncomment to run tests
// testIntegration();

?>