import { Header } from "../components/Header";
import { Main } from "../components/Main";

export default function DashBoard() {
    return (
      <div className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-800">
        <div aria-hidden="true" className="board-grid absolute inset-0" />
        <Header />
        <Main />
      </div>
    );
}
