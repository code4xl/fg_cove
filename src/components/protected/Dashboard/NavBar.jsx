import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCloseDMenu,
  LogOut,
  dashboardMenuState,
  selectAccount,
  setTheme,
  selectTheme,
} from "../../../app/DashboardSlice";

import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CircleUserRound,
  LogOutIcon,
  Menu,
  Sun,
  Moon,
  Sparkle,
  Sparkles,
  Users,
  Settings,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";

function NavBar() {
  const ifDMenuState = useSelector(dashboardMenuState);
  const user = useSelector(selectAccount);
  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onMenuToggle = () => {
    console.log(user);
    dispatch(
      setCloseDMenu({
        dashboardMenuState: !ifDMenuState,
      })
    );
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    dispatch(setTheme({ theme: newTheme }));
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const logout = () => {
    dispatch(LogOut());
    navigate("/");
  };

  return (
    <div className="flex w-full sticky top-0 z-50 bg-[var(--bg-secondary)] drop-shadow-xl h-[4rem] py-2">
      <div className="flex w-full px-[1rem] justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="text-black font-semibold text-lg">COVE</div>
          <button onClick={()=> {navigate("/linkages")}} className="flex items-center space-x-1 text-blue-600 cursor-pointer rounded-full border-[.1rem] hover:bg-gray-100 hover:drop-shadow-sm hover:drop-shadow-gray-500 border-gray-300 py-2 px-4 transition-all">
            <Sparkles className="h-5" />
            <span className="text-sm font-medium">Linkages</span>
          </button>
        </div>
        <div className="flex items-center"></div>
        <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2">
          <button className="bg-gray-100 border-[0.1rem] border-gray-300 rounded-full text-black px-3 py-1.5 hover:bg-white transition-all text-sm font-medium flex items-center space-x-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>Dashboard</span>
          </button>
          <button className="bg-gray-100 border-[0.1rem] border-gray-300 rounded-full text-black px-3 py-1.5 hover:bg-white transition-all text-sm font-medium flex items-center space-x-1">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Users</span>
          </button>
          <button className="bg-gray-100 border-[0.1rem] border-gray-300 rounded-full text-black px-3 py-1.5 hover:bg-white transition-all text-sm font-medium flex items-center space-x-1">
            <FileSpreadsheet className="w-4 h-4 text-orange-500" />
            <span>Sheets</span>
          </button>
        </div>
        <div
            className="flex items-center justify-center p-1 cursor-pointer"
            onClick={logout}
          >
            <LogOutIcon className="w-[3rem] text-[var(--accent-color)] rounded-xl" />
          </div>
          {/* <div className="flex items-center px-2 py-0.5 shadow-xl rounded-2xl border-[var(--highlight-color)] border-[.1rem]">
            <CircleUserRound className="w-[2rem] rounded-full text-[var(--accent-color)]" />
            <div className="flex flex-col items-start justify-center px-1">
              <h1 className="text-sm font-bold text-[var(--accent-color)] hidden sm:flex">
                {user.uname}
              </h1>
              <h1 className="text-sm font-bold text-[var(--text-secondary)] hidden sm:flex">
                User
              </h1>
            </div>
          </div> */}
          
        </div>
      </div>
    </div>
  );
}

export default NavBar;
