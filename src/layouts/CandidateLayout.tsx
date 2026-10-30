import { NavLink, Outlet } from "react-router-dom";
import { UserRound, FileText, ClipboardList } from "lucide-react";
export function CandidateLayout() {
  const items = [ { to: "/me", label: "Hồ sơ cá nhân", Icon: UserRound }, { to: "/me/resumes", label: "Quản lý CV", Icon: FileText }, { to: "/me/applications", label: "Đơn đã nộp", Icon: ClipboardList } ];
  return <div className="candidate-layout"><aside className="candidate-side"><span className="public-kicker">TÀI KHOẢN ỨNG VIÊN</span><h2>Không gian của bạn</h2><nav aria-label="Quản lý tài khoản ứng viên">{items.map(({ to, label, Icon }) => <NavLink key={to} to={to} end={to === "/me"} className={({ isActive }) => `candidate-side-link${isActive ? " active" : ""}`}><Icon size={18}/>{label}</NavLink>)}</nav></aside><div className="candidate-page"><Outlet/></div></div>;
}
