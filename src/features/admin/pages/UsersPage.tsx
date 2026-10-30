import {
  UsersRound,
  UserRoundCheck,
  UserRoundX,
  Building2,
} from "lucide-react";
import { StatCard } from "../../../components/common/StatCard";
import { formatDate } from "../../../components/common/format";
import { useCallback, useState } from "react";
import { DataTable } from "../../../components/common/DataTable";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import {
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useResource } from "../../../components/common/useResource";
import { adminApi } from "../api";
export function UsersPage({ userId }: { userId: number }) {
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const resource = useResource(
    useCallback((signal: AbortSignal) => adminApi.users(signal), []),
  );
  return (
    <main className="page">
      <PageHeading
        title="Quản lý người dùng"
        description="Theo dõi tài khoản và xử lý các trường hợp vi phạm."
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Tổng người dùng"
                value={resource.data.length}
                detail="Thành viên trên hệ thống"
                icon={UsersRound}
              />
              <StatCard
                label="Đang hoạt động"
                value={resource.data.filter((user) => user.isActive).length}
                detail="Tài khoản có thể đăng nhập"
                icon={UserRoundCheck}
                tone="green"
              />
              <StatCard
                label="Đã khóa"
                value={resource.data.filter((user) => !user.isActive).length}
                detail="Tạm ngừng truy cập"
                icon={UserRoundX}
                tone="amber"
              />
              <StatCard
                label="Nhà tuyển dụng"
                value={
                  resource.data.filter((user) => user.role === "employer")
                    .length
                }
                detail="Kết nối cơ hội việc làm"
                icon={Building2}
                tone="violet"
              />
            </div>
            <div className="alert">
              Tài khoản đã khóa hiện chưa thể mở lại. Chức năng mở khóa chưa
              được hệ thống hỗ trợ.
            </div>
            <DataTable
              title="Danh sách người dùng"
              filtered={!!role || !!active}
              rows={resource.data.filter(
                (user) =>
                  (!role || user.role === role) &&
                  (!active || String(user.isActive) === active),
              )}
              searchText={(user) => `${user.fullName} ${user.email} ${user.id}`}
              searchLabel="Tìm theo tên, email, mã người dùng…"
              filters={
                <>
                  <select
                    aria-label="Lọc vai trò"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="">Mọi vai trò</option>
                    <option value="candidate">Ứng viên</option>
                    <option value="employer">Nhà tuyển dụng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                  <select
                    aria-label="Lọc trạng thái tài khoản"
                    value={active}
                    onChange={(event) => setActive(event.target.value)}
                  >
                    <option value="">Mọi trạng thái</option>
                    <option value="true">Hoạt động</option>
                    <option value="false">Đã khóa</option>
                  </select>
                </>
              }
              columns={[
                {
                  key: "user",
                  title: "Người dùng",
                  render: (user) => (
                    <>
                      <div className="entity-cell">
                        <span
                          className={`entity-avatar ${user.role === "admin" ? "violet" : ""}`}
                        >
                          {user.fullName.charAt(0)}
                        </span>
                        <strong>{user.fullName}</strong>
                      </div>
                      <div className="cell-muted">
                        #{user.id} · {user.email}
                      </div>
                    </>
                  ),
                },
                {
                  key: "role",
                  title: "Vai trò",
                  render: (user) => <StatusBadge status={user.role} />,
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (user) => (
                    <StatusBadge
                      status={user.isActive ? "active" : "inactive"}
                    />
                  ),
                },
                {
                  key: "date",
                  title: "Ngày tạo",
                  render: (user) => formatDate(user.createdAt),
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (user) => (
                    <div className="row-actions">
                      {user.isActive ? (
                        <ConfirmAction
                          label="Khóa"
                          title="Khóa tài khoản?"
                          description={`Vô hiệu hóa tài khoản ${user.email}. Tài khoản sẽ không thể đăng nhập mới. Hiện chưa có chức năng mở khóa.`}
                          disabled={user.id === userId}
                          onConfirm={async () => {
                            const updated = await adminApi.lockUser(user.id);
                            resource.setData(
                              (list) =>
                                list?.map((item) =>
                                  item.id === user.id ? updated : item,
                                ) || [],
                            );
                          }}
                        />
                      ) : (
                        <button
                          className="action-button"
                          disabled
                          title="Hệ thống chưa hỗ trợ mở khóa"
                        >
                          Mở khóa
                        </button>
                      )}
                      <ConfirmAction
                        label="Xóa"
                        title="Xóa vĩnh viễn người dùng?"
                        description={`Xóa ${user.email} và dữ liệu liên quan. Thao tác không thể hoàn tác.`}
                        danger
                        disabled={user.id === userId}
                        onConfirm={async () => {
                          await adminApi.deleteUser(user.id);
                          resource.setData(
                            (list) =>
                              list?.filter((item) => item.id !== user.id) || [],
                          );
                        }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </>
        )
      )}
    </main>
  );
}
