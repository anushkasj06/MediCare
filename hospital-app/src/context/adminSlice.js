import { createSlice } from '@reduxjs/toolkit'

export const adminSlice = createSlice({
  name: 'admin',
  initialState: { stats: null, users: [], pendingDoctors: [], reports: [], logs: [] },
  reducers: {
    setStats(state, { payload })          { state.stats          = payload },
    setUsers(state, { payload })          { state.users          = payload },
    setPendingDoctors(state, { payload }) { state.pendingDoctors = payload },
    setReports(state, { payload })        { state.reports        = payload },
    setLogs(state, { payload })           { state.logs           = payload },
  },
})
export const { setStats, setUsers, setPendingDoctors, setReports, setLogs } = adminSlice.actions
export default adminSlice.reducer
