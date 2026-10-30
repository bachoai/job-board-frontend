import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";
import { EmployerLayout } from "../../layouts/EmployerLayout";
import { AdminLayout } from "../../layouts/AdminLayout";
import { PublicLayout } from "../../layouts/PublicLayout";
import { CandidateLayout } from "../../layouts/CandidateLayout";
import { LoginPage, roleHome } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { JobsPage } from "../../features/public/pages/JobsPage";
import { JobDetailPage } from "../../features/public/pages/JobDetailPage";
import { CompaniesPage as PublicCompaniesPage } from "../../features/public/pages/CompaniesPage";
import { CompanyDetailPage } from "../../features/public/pages/CompanyDetailPage";
import { ProfilePage } from "../../features/candidate/pages/ProfilePage";
import { ResumesPage } from "../../features/candidate/pages/ResumesPage";
import { ApplicationsPage as CandidateApplicationsPage } from "../../features/candidate/pages/ApplicationsPage";
import { ApplicationDetailPage as CandidateApplicationDetailPage } from "../../features/candidate/pages/ApplicationDetailPage";
import { CreateJobPage } from "../../features/employer/pages/CreateJobPage";
import { EditJobPage } from "../../features/employer/pages/EditJobPage";
import { CompanyPage } from "../../features/employer/pages/CompanyPage";
import { MyJobsPage } from "../../features/employer/pages/MyJobsPage";
import { JobApplicationsPage } from "../../features/employer/pages/JobApplicationsPage";
import { ApplicationDetailPage } from "../../features/employer/pages/ApplicationDetailPage";
import { ApplicationsPage } from "../../features/employer/pages/ApplicationsPage";
import { UsersPage } from "../../features/admin/pages/UsersPage";
import { JobsPage as AdminJobsPage } from "../../features/admin/pages/JobsPage";
import { CompaniesPage as AdminCompaniesPage } from "../../features/admin/pages/CompaniesPage";

function RoleRoutes() {
  const { session, setSubmittingJob } = useAuth();
  const userId = session?.user.id || 0;
  const home = session ? roleHome(session.user.role) : "/jobs";
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route element={<PublicLayout/>}>
      <Route path="/" element={<Navigate to="/jobs" replace/>}/>
      <Route path="/jobs" element={<JobsPage/>}/>
      <Route path="/jobs/:id" element={<JobDetailPage/>}/>
      <Route path="/companies" element={<PublicCompaniesPage/>}/>
      <Route path="/companies/:id" element={<CompanyDetailPage/>}/>
      <Route path="/me" element={<ProtectedRoute role="candidate"><CandidateLayout/></ProtectedRoute>}>
        <Route index element={<ProfilePage/>}/>
        <Route path="resumes" element={<ResumesPage/>}/>
        <Route path="applications" element={<CandidateApplicationsPage/>}/>
        <Route path="applications/:id" element={<CandidateApplicationDetailPage/>}/>
      </Route>
    </Route>
    <Route path="/employer" element={<ProtectedRoute role="employer"><EmployerLayout/></ProtectedRoute>}>
      <Route path="company" element={<CompanyPage userId={userId}/>}/>
      <Route path="jobs" element={<MyJobsPage userId={userId}/>}/>
      <Route path="jobs/new" element={session && <CreateJobPage user={session.user} onSubmittingChange={setSubmittingJob}/>}/>
      <Route path="jobs/:id/edit" element={session && <EditJobPage user={session.user} onSubmittingChange={setSubmittingJob}/>}/>
      <Route path="jobs/:id/applications" element={<JobApplicationsPage/>}/>
      <Route path="applications" element={<ApplicationsPage userId={userId}/>}/>
      <Route path="applications/:id" element={<ApplicationDetailPage userId={userId}/>}/>
      <Route index element={<Navigate to="jobs" replace/>}/>
    </Route>
    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout/></ProtectedRoute>}>
      <Route path="users" element={<UsersPage userId={userId}/>}/>
      <Route path="jobs" element={<AdminJobsPage/>}/>
      <Route path="companies" element={<AdminCompaniesPage/>}/>
      <Route index element={<Navigate to="users" replace/>}/>
    </Route>
    <Route path="*" element={<main className="access-screen"><h1>Không tìm thấy trang</h1><p>Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p><Link className="primary" to={home}>Quay về trang chính →</Link></main>}/>
  </Routes>;
}
export function AppRouter() { return <BrowserRouter><RoleRoutes/></BrowserRouter>; }
