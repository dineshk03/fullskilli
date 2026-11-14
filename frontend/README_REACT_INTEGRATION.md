# React LMS Integration

This document outlines the React components and services created for LMS integration with the plan management system.

## 📁 **Files Created/Modified**

### **New Files:**

#### 1. **Services**
```
src/services/planService.js
```
- Complete plan management service
- LMS integration functions
- Skilli system integration
- Utility functions for plan validation

#### 2. **Components**
```
src/components/core/PlanActivation.jsx
src/components/core/PlanDashboard.jsx
src/components/core/CourseAccessButton.jsx
src/components/core/PlanStatusCard.jsx
src/components/core/LMSAccessModal.jsx
```

#### 3. **Pages**
```
src/pages/PlanActivation.jsx
src/pages/PlanDashboard.jsx
```

#### 4. **API Endpoints**
```
src/services/apis.js (updated)
```
- Added planEndpoints
- Added skilliEndpoints  
- Added lmsEndpoints

#### 5. **Routes**
```
src/App.jsx (updated)
```
- Added `/activate-plan` route
- Added `/dashboard/plans` route

## 🚀 **Usage Examples**

### **Plan Activation Component**

```jsx
import PlanActivation from '../components/core/PlanActivation';

function MyComponent() {
  return (
    <PlanActivation
      pid="USER_PID_HERE"
      courseId="COURSE_123"
      onSuccess={(planData, lmsData) => {
        console.log('Access granted:', planData, lmsData);
      }}
      onError={(error) => {
        console.error('Activation failed:', error);
      }}
    />
  );
}
```

### **Course Access Button**

```jsx
import CourseAccessButton from '../components/core/CourseAccessButton';

function CourseCard({ course }) {
  const { user } = useSelector((state) => state.profile);
  const token = getToken();

  return (
    <CourseAccessButton
      courseId={course._id}
      courseTitle={course.courseName}
      pid={user._id}
      token={token}
      variant="primary"
      size="medium"
      onAccessGranted={(planData, lmsData) => {
        // Handle successful access
      }}
    />
  );
}
```

### **Plan Dashboard**

```jsx
import PlanDashboard from '../components/core/PlanDashboard';

function PlansPage() {
  const { user } = useSelector((state) => state.profile);
  const token = getToken();

  return (
    <PlanDashboard 
      pid={user._id} 
      token={token}
    />
  );
}
```

### **Using Plan Service**

```jsx
import { 
  validateActivationForLMS, 
  getLMSAccessURL,
  checkCourseAccess 
} from '../services/planService';

async function handleCourseAccess(courseId) {
  try {
    // Check if user has access
    const access = await checkCourseAccess(userPid, courseId, token);
    
    if (access.has_access) {
      // User has access, redirect to LMS
      const lmsUrl = await getLMSAccessURL(userPid, activationCode, courseId);
      window.open(lmsUrl.access_url, '_blank');
    } else {
      // Show activation modal
      setShowActivationModal(true);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🔧 **Component Props Reference**

### **PlanActivation**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pid` | string | required | User PID |
| `courseId` | string | null | Course ID for specific access |
| `onSuccess` | function | null | Success callback |
| `onError` | function | null | Error callback |
| `redirectPath` | string | '/dashboard' | LMS redirect path |
| `showPlanDetails` | boolean | true | Show plan details after activation |

### **CourseAccessButton**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `courseId` | string | required | Course ID |
| `courseTitle` | string | '' | Course title |
| `pid` | string | required | User PID |
| `token` | string | required | Auth token |
| `variant` | string | 'primary' | Button style |
| `size` | string | 'medium' | Button size |
| `showStatus` | boolean | true | Show access status |
| `onAccessGranted` | function | null | Success callback |
| `onAccessDenied` | function | null | Error callback |

### **PlanDashboard**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pid` | string | required | User PID |
| `token` | string | required | Auth token |

### **PlanStatusCard**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `plan` | object | required | Plan data object |
| `compact` | boolean | false | Compact view |
| `showProgress` | boolean | true | Show usage progress |
| `showValidity` | boolean | true | Show validity period |
| `className` | string | '' | Additional CSS classes |

## 🎨 **Styling & Customization**

### **Button Variants**
- `primary` - Blue background, white text
- `secondary` - Light background, colored text
- `outline` - Transparent background, colored border

### **Button Sizes**
- `small` - Small padding, text-sm
- `medium` - Medium padding, text-sm
- `large` - Large padding, text-base

### **Status Colors**
- **Active**: Green background, green text
- **Expired**: Red background, red text
- **Checking**: Gray background, gray text

## 🔄 **Integration with Existing Components**

### **Update Course Cards**

```jsx
// In your existing course card component
import CourseAccessButton from '../components/core/CourseAccessButton';

function CourseCard({ course }) {
  return (
    <div className="course-card">
      {/* Existing course content */}
      <h3>{course.courseName}</h3>
      <p>{course.courseDescription}</p>
      
      {/* Replace/enhance existing button */}
      <CourseAccessButton
        courseId={course._id}
        courseTitle={course.courseName}
        pid={user._id}
        token={token}
        variant="primary"
      />
    </div>
  );
}
```

### **Add Plan Dashboard to Navigation**

```jsx
// In your navigation component
function Navigation() {
  return (
    <nav>
      {/* Existing nav items */}
      <Link to="/dashboard/plans">My Plans</Link>
    </nav>
  );
}
```

### **Add Plan Activation Link**

```jsx
// In your dashboard or settings
function Dashboard() {
  return (
    <div>
      {/* Existing dashboard content */}
      
      <Link 
        to="/activate-plan" 
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Activate Course Access
      </Link>
    </div>
  );
}
```

## 🌐 **Environment Variables**

Make sure these are set in your `.env` file:

```env
VITE_REACT_APP_BASE_URL=http://your-api-url.com
```

## 🔐 **Authentication**

All plan service functions require an authentication token. Use the existing auth system:

```jsx
import { getToken } from '../services/operations/authAPI';

const token = getToken();
```

## 📱 **Responsive Design**

All components are fully responsive and work on:
- Desktop (1024px+)
- Tablet (768px-1023px)
- Mobile (320px-767px)

## 🎯 **Best Practices**

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Loading States**: Show loading indicators during API calls
3. **User Feedback**: Use toast notifications for success/error messages
4. **Token Management**: Ensure tokens are fresh before API calls
5. **Component Reuse**: Use the provided components for consistency

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"User PID not found"**
   - Ensure user is logged in
   - Check if user object contains `_id` or `pid`

2. **"Invalid activation code"**
   - Verify activation code is correct
   - Check if code belongs to the user

3. **"No course access available"**
   - Check user's plan limits
   - Verify course usage hasn't been exhausted

4. **API Connection Issues**
   - Verify `VITE_REACT_APP_BASE_URL` is correct
   - Check if API server is running

### **Debug Mode**

Add this to your component for debugging:

```jsx
useEffect(() => {
  console.log('User PID:', userPid);
  console.log('Token:', token ? 'Present' : 'Missing');
}, [userPid, token]);
```

## 📞 **Support**

For integration issues:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Ensure all required props are provided
4. Test with valid activation codes and user data
