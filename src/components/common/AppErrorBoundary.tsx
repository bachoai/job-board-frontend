import { Component } from "react";
import type { ReactNode } from "react";

/** Keep an unexpected render error from leaving the entire application blank. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="page public-page"><section className="card" role="alert">
      <h1>Không thể hiển thị trang này</h1>
      <p>Đã xảy ra lỗi khi hiển thị dữ liệu. Hãy tải lại trang để thử lại.</p>
      <div className="ai-actions"><button type="button" className="primary" onClick={() => window.location.reload()}>Tải lại trang</button><a className="secondary" href="/jobs">Về trang việc làm</a></div>
    </section></main>;
  }
}
