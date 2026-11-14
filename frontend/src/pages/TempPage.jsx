import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
const TempPage = () => {
  const {
    pid
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useSelector(state => state.profile);
  return <div className="flex min-h-screen items-center justify-center bg-richblack-900">
            <div className="w-full max-w-2xl rounded-lg bg-richblack-800 p-8 shadow-lg">
                <div className="text-center space-y-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                        <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-richblack-5">
                        Welcome to Skilli!
                    </h1>

                    <div className="bg-richblack-700 rounded-lg p-6 text-left">
                        <h2 className="text-xl font-semibold text-richblack-5 mb-4">
                            User Information
                        </h2>
                        <div className="space-y-2 text-richblack-200">
                            <p>
                                <span className="font-semibold text-richblack-5">Name:</span>{' '}
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p>
                                <span className="font-semibold text-richblack-5">Email:</span>{' '}
                                {user?.email}
                            </p>
                            <p>
                                <span className="font-semibold text-richblack-5">PHP User ID (PID):</span>{' '}
                                {pid}
                            </p>
                            <p>
                                <span className="font-semibold text-richblack-5">Account Type:</span>{' '}
                                {user?.accountType}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={() => navigate('/dashboard/my-profile')} className="rounded-lg bg-yellow-50 px-6 py-3 font-semibold text-richblack-900 hover:bg-yellow-100 transition-all">
                            Go to Dashboard
                        </button>
                        <button onClick={() => navigate('/catalog/all-courses')} className="rounded-lg bg-richblack-700 px-6 py-3 font-semibold text-richblack-5 hover:bg-richblack-600 transition-all">
                            Browse Courses
                        </button>
                    </div>

                    <p className="text-sm text-richblack-300">
                        You have been successfully logged in from skilli.jobs
                    </p>
                </div>
            </div>
        </div>;
};
export default TempPage;
