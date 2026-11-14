import { ACCOUNT_TYPE } from '../src/utils/constants';

export const sidebarLinks = [
  {
    id: 1,
    name: "Analytics",
    path: "/dashboard/admin/analytics",
    accountType: [ACCOUNT_TYPE.ADMIN],
    icon: "VscGraph",
  },
  {
    id: 2,
    name: "My Profile",
    path: "/dashboard/my-profile",
    icon: "VscAccount",
  },
  {
    id: 3,
    name: "Dashboard",
    path: "/dashboard/instructor",
    accountType: [ACCOUNT_TYPE.INSTRUCTOR],
    icon: "VscDashboard",
  },
  {
    id: 4,
    name: "My Courses",
    path: "/dashboard/my-courses",
    accountType: [ACCOUNT_TYPE.INSTRUCTOR],
    icon: "VscVm",
  },
  {
    id: 9,
    name: "Chats",
    path: "/dashboard/instructor-chats",
    accountType: [ACCOUNT_TYPE.INSTRUCTOR],
    icon: "VscComment",
  },
  {
    id: 10,
    name: "Quiz Management",
    path: "/dashboard/instructor/quiz-management",
    accountType: [ACCOUNT_TYPE.INSTRUCTOR],
    icon: "VscQuestion",
  },
  {
    id: 12,
    name: "Assignments",
    path: "/dashboard/instructor-assignments",
    accountType: [ACCOUNT_TYPE.INSTRUCTOR],
    icon: "VscNotebook",
  },
  {
    id: 11,
    name: "Zoom Meetings",
    path: "/dashboard/instructor/zoom-meetings",
    accountType: [ACCOUNT_TYPE.INSTRUCTOR],
    icon: "VscDeviceCameraVideo",
  },
  {
    id: 5,
    name: "Enrolled Courses",
    path: "/dashboard/enrolled-courses",
    accountType: [ACCOUNT_TYPE.STUDENT],
    icon: "VscMortarBoard",
  },
];
