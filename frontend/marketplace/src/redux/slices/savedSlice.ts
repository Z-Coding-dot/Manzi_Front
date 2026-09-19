import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface SavedState {
  propertyIds: string[]
}

const initialState: SavedState = { propertyIds: [] }

const savedSlice = createSlice({
  name: 'saved',
  initialState,
  reducers: {
    toggleSaved(state, action: PayloadAction<string>) {
      const id = action.payload
      state.propertyIds = state.propertyIds.includes(id)
        ? state.propertyIds.filter((p) => p !== id)
        : [...state.propertyIds, id]
    },
  },
})

export const { toggleSaved } = savedSlice.actions
export default savedSlice.reducer
