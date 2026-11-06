import { AuthProvider } from "./app/providers/AuthProvider";
import { AppRouter } from "./app/router/AppRouter";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import "./App.css";
import "./styles/public.css";
import "./features/ai/ai.css";
export default function App() {
  return (
    <AppErrorBoundary><AuthProvider>
      <AppRouter />
    </AuthProvider></AppErrorBoundary>
  );
}
