import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../app/providers/useAuth";
const pageTitles: Record<string, string> = {
  "/employer/company": "Công ty của tôi",
  "/employer/jobs": "Tin tuyển dụng",
  "/employer/jobs/new": "Đăng tin mới",
  "/employer/applications": "Hồ sơ ứng tuyển",
  "/admin/users": "Người dùng",
  "/admin/jobs": "Quản lý tin tuyển dụng",
  "/admin/companies": "Quản lý công ty",
};
export function MainLayout({ role }: { role: "employer" | "admin" }) {
  const location = useLocation();
  const { session } = useAuth();
  const drawer = useRef<HTMLDialogElement>(null);
  const title =
    pageTitles[location.pathname] ||
    (location.pathname.endsWith("/edit")
      ? "Sửa tin tuyển dụng"
      : location.pathname.endsWith("/applications")
        ? "Hồ sơ ứng tuyển"
        : "Chi tiết hồ sơ");
  useEffect(() => {
    document.title = `${title} | Jobboard`;
    window.scrollTo(0, 0);
  }, [title, location.pathname]);
  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-content">
        Đến nội dung chính
      </a>
      <aside className="sidebar desktop-sidebar">
        <Sidebar role={role} />
      </aside>
      <dialog
        className="mobile-drawer"
        ref={drawer}
        aria-label="Menu điều hướng"
        onClick={(event) => {
          if (event.target === drawer.current) drawer.current?.close();
        }}
      >
        <div className="drawer-content">
          <Sidebar role={role} close={() => drawer.current?.close()} />
        </div>
      </dialog>
      <div className="main-shell">
        <Header
          title={title}
          role={role}
          openMenu={() => drawer.current?.showModal()}
        />
        <div
          id="workspace-content"
          className="workspace-content"
          key={`${session?.user.id}:${location.pathname}`}
        >
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}
