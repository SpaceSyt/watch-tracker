export type AddTitleEntryState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialAddTitleEntryState: AddTitleEntryState = {
  status: "idle",
  message: null,
};

export type UpdateTitleEntryFeedbackState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialUpdateTitleEntryFeedbackState: UpdateTitleEntryFeedbackState =
  {
    status: "idle",
    message: null,
  };

export type UpdateTitleEntryProgressState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialUpdateTitleEntryProgressState: UpdateTitleEntryProgressState =
  {
    status: "idle",
    message: null,
  };
