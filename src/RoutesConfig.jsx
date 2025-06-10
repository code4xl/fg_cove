import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HeroPage, Login, VerifyEmail } from './components';
import { dashboardMenuState, isUserLoggedIn, selectTheme } from './app/DashboardSlice';

import NavBar from './components/protected/Dashboard/NavBar';
import Sidebar from './components/utils/Sidebar';
import Dashboard from './components/protected/Dashboard/Dashboard';
import ViewSheets from './components/protected/Views/Main';
// import SheetDisplay from './components/protected/Linkages/SheetDisplay';
import PageNotFound from './components/common/PageNotFound';
import Linkages from './components/protected/Linkages/Main';
import { isDeatailSheetBar } from './app/LinkagesSlice';
import SheetManagement from './components/protected/Views/SheetViews';
import UserControl from './components/protected/UserControl//UserControl';
import LoginAdmin from './components/common/LoginAdmin';

const RoutesConfig = () => {
  const isLoggedIn = useSelector(isUserLoggedIn);
  const ifDMenuState = useSelector(dashboardMenuState);
  const theme = useSelector(selectTheme);
  const isDetailSheet = useSelector(isDeatailSheetBar);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/"
          key={'home'}
          className="transition-all scrollbar-hide"
          element={[<HeroPage key={'HeroPage'} />]}
        />
        <Route
          path="/login"
          className="transition-all scrollbar-hide"
          element={[<Login />]}
        />
        <Route
          path="/admin-login"
          className="transition-all scrollbar-hide"
          element={[<LoginAdmin />]}
        />
        <Route
          path="/verify-email"
          className="transition-all scrollbar-hide"
          element={[<VerifyEmail />]}
        />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  } else {
    return (
      <div
        className={`w-full h-[100vh] bg-[var(--bg-primary)] flex flex-col overflow-y-auto scrollbar-hide`}
      >
        {/*<Sidebar isOpen={ifDMenuState} />*/}
        <NavBar />
        
        <div className={`${ifDMenuState && 'pl-[0rem]'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<PageNotFound />} />
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            
            <Route path="/sheets" element={<ViewSheets />} />
            <Route path="/linkages" element={<Linkages />} />
            <Route path="/sheets-try" element={<SheetManagement />} />
            <Route path="/user-control" element={<UserControl />} />
          </Routes>
          {/* <div className="bg-[var(--bg-secondary)] b-2 pr-2 text-sm pb-1 flex justify-end items-center">
            <p className="text-[var(--text-primary)]">
              Designed and Developed with ❤️ by{' '}
              <a
                href="https://hareshkurade.netlify.app"
                className="text-[var(--accent-color)]"
              >
                Haresh
              </a>
            </p>
          </div> */}
        </div>
      </div>
    );
  }
};

export default RoutesConfig;