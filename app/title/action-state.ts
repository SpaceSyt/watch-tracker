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

export type CreateCustomListState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialCreateCustomListState: CreateCustomListState = {
  status: "idle",
  message: null,
};

export type UpdateTitleEntryCustomListsState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialUpdateTitleEntryCustomListsState: UpdateTitleEntryCustomListsState =
  {
    status: "idle",
    message: null,
  };

export type BatchCustomListActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialBatchCustomListActionState: BatchCustomListActionState = {
  status: "idle",
  message: null,
};

export type CustomListActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialCustomListActionState: CustomListActionState = {
  status: "idle",
  message: null,
};
