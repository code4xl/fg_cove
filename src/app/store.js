import { configureStore } from '@reduxjs/toolkit';
import DashboardSlice from './DashboardSlice.js';
import LinkagesSlice from './LinkagesSlice.js';

const Store = configureStore({
  reducer: {
    dashboard: DashboardSlice,
    linkages: LinkagesSlice,
  },
});

export default Store;
