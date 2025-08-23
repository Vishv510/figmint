import { Header } from "../components/Header";
import { Main } from "../components/Main";

export default function DashBoard() {
    return <>
      <div className="bg-white border relative"> 
        {/* Header */}
        <Header />
        <Main />
      </div>
    </>
}
