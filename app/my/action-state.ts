export type AddSampleEntryState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialAddSampleEntryState: AddSampleEntryState = {
  status: "idle",
  message: null,
};
