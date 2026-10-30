import { ChevronRight, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "../../app/providers/useAuth";
export function Header({
  title,
  role,
  openMenu,
}: {
  title: string;
  role: "employer" | "admin";
  openMenu: () => void;
}) {
  const { session, busy, submittingJob, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="header-left">
        <button
          className="icon-button menu-toggle"
          aria-label="Mở menu điều hướng"
          onClick={openMenu}
        >
          <Menu size={22} />
        </button>
        <div className="breadcrumb">
          <span>{role === "admin" ? "Quản trị viên" : "Nhà tuyển dụng"}</span>
          <ChevronRight size={14} />
          <strong>{title}</strong>
        </div>
      </div>
      <div className="header-right">
        <span className="role-indicator">
          <ShieldCheck size={14} />
          {role === "admin" ? "Quản trị" : "Nhà tuyển dụng"}
        </span>
        <div className="account">
          <span className="avatar">
            {session?.user.fullName.charAt(0) || "J"}
          </span>
          <div className="account-name">
            <strong>{session?.user.fullName}</strong>
            <span>{session?.user.email}</span>
          </div>
          <button
            className="logout-button"
            disabled={busy || submittingJob}
            onClick={logout}
            aria-label={busy ? "Đang đăng xuất…" : "Đăng xuất"}
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
