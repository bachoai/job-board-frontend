import {
  BriefcaseBusiness,
  Building2,
  Files,
  Plus,
  UsersRound,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth";
export function Sidebar({
  role,
  close,
}: {
  role: "employer" | "admin";
  close?: () => void;
}) {
  const { session, submittingJob } = useAuth();
  const admin = role === "admin";
  const items = admin
    ? [
        { to: "/admin/users", label: "Người dùng", Icon: UsersRound },
        {
          to: "/admin/jobs",
          label: "Quản lý tin tuyển dụng",
          Icon: ClipboardList,
        },
        { to: "/admin/companies", label: "Quản lý công ty", Icon: Building2 },
      ]
    : [
        { to: "/employer/company", label: "Công ty của tôi", Icon: Building2 },
        {
          to: "/employer/jobs",
          label: "Tin tuyển dụng",
          Icon: BriefcaseBusiness,
        },
        { to: "/employer/jobs/new", label: "Đăng tin mới", Icon: Plus },
        { to: "/employer/applications", label: "Hồ sơ ứng tuyển", Icon: Files },
      ];
  return (
    <>
      <div className="sidebar-brand">
        <Link
          className="brand"
          to={admin ? "/admin/users" : "/employer/jobs"}
          onClick={close}
        >
          <span className="brand-icon">
            <BriefcaseBusiness size={22} strokeWidth={2.2} />
          </span>
          Jobboard<span className="brand-dot">.</span>
        </Link>
        {close && (
          <button
            className="icon-button drawer-close"
            aria-label="Đóng menu"
            onClick={close}
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="workspace-switch">
        <span className="workspace-symbol">
          {admin ? <ShieldCheck size={20} /> : <Building2 size={20} />}
        </span>
        <div>
          <strong>
            {admin ? "Quản trị hệ thống" : "Không gian tuyển dụng"}
          </strong>
          <span>{admin ? "Quản trị viên" : "Nhà tuyển dụng"}</span>
        </div>
        <span className="workspace-indicator" />
      </div>
      <div className="workspace-label">
        {admin ? "QUẢN LÝ HỆ THỐNG" : "QUẢN LÝ TUYỂN DỤNG"}
      </div>
      <nav aria-label="Điều hướng">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            end
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item${isActive ? " nav-active" : ""}`
            }
            onClick={(event) => {
              if (submittingJob) event.preventDefault();
              else close?.();
            }}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-tip">
        <span className="tip-icon">
          <Sparkles size={20} />
        </span>
        <h3>
          {admin
            ? "Chất lượng tạo niềm tin."
            : "Tuyển đúng người. Xây đội ngũ tốt."}
        </h3>
        <p>
          {admin
            ? "Cùng xây dựng một cộng đồng tuyển dụng minh bạch và đáng tin cậy."
            : "Thông tin rõ ràng là bước đầu để kết nối với ứng viên phù hợp."}
        </p>
        {!admin && (
          <Link to="/employer/jobs/new" onClick={close}>
            Tạo cơ hội mới <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      <div className="sidebar-account">
        <span className="avatar">
          {session?.user.fullName.charAt(0) || "J"}
        </span>
        <div>
          <strong>{session?.user.fullName}</strong>
          <span>{admin ? "Quản trị viên" : "Nhà tuyển dụng"}</span>
        </div>
        <ShieldCheck size={17} />
      </div>
    </>
  );
}
