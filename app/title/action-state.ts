export type AddTitleEntryState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialAddTitleEntryState: AddTitleEntryState = {
  status: "idle",
  message: null,
};
