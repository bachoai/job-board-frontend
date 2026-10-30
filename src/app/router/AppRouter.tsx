import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";
import { EmployerLayout } from "../../layouts/EmployerLayout";
import { AdminLayout } from "../../layouts/AdminLayout";
import { CreateJobPage } from "../../features/employer/pages/CreateJobPage";
import { EditJobPage } from "../../features/employer/pages/EditJobPage";
import { CompanyPage } from "../../features/employer/pages/CompanyPage";
import { MyJobsPage } from "../../features/employer/pages/MyJobsPage";
import { JobApplicationsPage } from "../../features/employer/pages/JobApplicationsPage";
import { ApplicationDetailPage } from "../../features/employer/pages/ApplicationDetailPage";
import { ApplicationsPage } from "../../features/employer/pages/ApplicationsPage";
import { UsersPage } from "../../features/admin/pages/UsersPage";
import { JobsPage } from "../../features/admin/pages/JobsPage";
import { CompaniesPage } from "../../features/admin/pages/CompaniesPage";
function RoleRoutes() {
  const { session, setSubmittingJob } = useAuth();
  const userId = session?.user.id || 0;
  const home =
    session?.user.role === "admin" ? "/admin/users" : "/employer/jobs";
  return (
    <Routes>
      <Route
        path="/employer"
        element={
          <ProtectedRoute role="employer">
            <EmployerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="company" element={<CompanyPage userId={userId} />} />
        <Route path="jobs" element={<MyJobsPage userId={userId} />} />
        <Route
          path="jobs/new"
          element={
            session && (
              <CreateJobPage
                user={session.user}
                onSubmittingChange={setSubmittingJob}
              />
            )
          }
        />
        <Route
          path="jobs/:id/edit"
          element={
            session && (
              <EditJobPage
                user={session.user}
                onSubmittingChange={setSubmittingJob}
              />
            )
          }
        />
        <Route path="jobs/:id/applications" element={<JobApplicationsPage />} />
        <Route
          path="applications"
          element={<ApplicationsPage userId={userId} />}
        />
        <Route
          path="applications/:id"
          element={<ApplicationDetailPage userId={userId} />}
        />
        <Route index element={<Navigate to="jobs" replace />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<UsersPage userId={userId} />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route index element={<Navigate to="users" replace />} />
      </Route>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route
        path="/login"
        element={
          session && ["employer", "admin"].includes(session.user.role) ? (
            <Navigate to={home} replace />
          ) : (
            <ProtectedRoute role="employer">
              <EmployerLayout />
            </ProtectedRoute>
          )
        }
      />
      <Route
        path="*"
        element={
          <main className="access-screen">
            <h1>Không tìm thấy trang</h1>
            <p>Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p>
            <Link className="primary" to={home}>
              Về không gian làm việc →
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <RoleRoutes />
    </BrowserRouter>
  );
}
