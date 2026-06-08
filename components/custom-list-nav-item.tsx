"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { initialCustomListActionState } from "@/app/title/action-state";
import {
  deleteCustomListFromMy,
  renameCustomListFromMy,
} from "@/app/title/actions";
import { useI18n } from "@/components/language-preference";

type CustomListNavItemProps = {
  id: string;
  name: string;
  count: number;
  selected: boolean;
};

function collectionLinkClass(selected: boolean) {
  return `flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
    selected
      ? "border-zinc-400 bg-white text-zinc-950 shadow-sm dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-50"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
  }`;
}

function countBadgeClass(selected: boolean) {
  return `rounded px-1.5 py-0.5 text-xs ${
    selected
      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
  }`;
}

export function CustomListNavItem({
  id,
  name,
  count,
  selected,
}: CustomListNavItemProps) {
  const dictionary = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [renameState, renameFormAction] = useActionState(
    renameCustomListFromMy,
    initialCustomListActionState,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setIsConfirmingDelete(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsRenaming(false);
        setIsConfirmingDelete(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  return (
    <div ref={menuRef} className="group relative min-w-0">
      <Link
        href={`/my?list=${encodeURIComponent(id)}`}
        className={`${collectionLinkClass(selected)} pr-12`}
      >
        <span className="min-w-0 truncate">{name}</span>
      </Link>
      <span className="pointer-events-none absolute right-3 top-1/2 flex h-6 w-8 -translate-y-1/2 items-center justify-center">
        <span
          className={`${countBadgeClass(selected)} absolute transition-opacity group-hover:opacity-0 ${
            isOpen ? "opacity-0" : ""
          }`}
        >
          {count}
        </span>
        <span
          aria-hidden="true"
          className={`absolute rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 transition-opacity dark:bg-zinc-800 dark:text-zinc-300 ${
            isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          ...
        </span>
      </span>
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          setIsRenaming(false);
          setIsConfirmingDelete(false);
        }}
        className="absolute right-3 top-1/2 h-6 w-8 -translate-y-1/2 cursor-pointer opacity-0"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={dictionary.library.openListActions(name)}
      />
      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-md border border-zinc-200 bg-white text-sm shadow-lg"
          role="menu"
          aria-label={dictionary.library.listActionsFor(name)}
        >
          <button
            type="button"
            onClick={() => {
              setIsRenaming(true);
              setIsConfirmingDelete(false);
            }}
            className="w-full px-3 py-2 text-left font-medium text-zinc-700 hover:bg-zinc-50"
            role="menuitem"
          >
            {dictionary.library.renameList}
          </button>
          {isRenaming ? (
            <form
              action={renameFormAction}
              onSubmit={() => {
                setIsRenaming(false);
                setIsOpen(false);
              }}
              className="grid gap-2 border-t border-zinc-100 px-3 py-2"
            >
              <input type="hidden" name="listId" value={id} />
              <input
                ref={renameInputRef}
                type="text"
                name="name"
                defaultValue={name}
                maxLength={60}
                className="min-h-8 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
              />
              <button
                type="submit"
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {dictionary.common.save}
              </button>
              {renameState.message ? (
                <p
                  className={`text-xs ${
                    renameState.status === "error"
                      ? "text-red-700"
                      : "text-zinc-500"
                  }`}
                >
                  {renameState.message}
                </p>
              ) : null}
            </form>
          ) : null}
          {isConfirmingDelete ? (
            <form
              action={deleteCustomListFromMy}
              className="grid gap-2 border-t border-zinc-100 px-3 py-2"
            >
              <input type="hidden" name="listId" value={id} />
              <input
                type="hidden"
                name="returnToDefault"
                value={selected ? "true" : "false"}
              />
              <p className="text-xs leading-5 text-zinc-500">
                {dictionary.library.confirmRemoveList}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  {dictionary.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-md border border-red-300 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-500/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
                >
                  {dictionary.common.confirm}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsConfirmingDelete(true);
                setIsRenaming(false);
              }}
              className="w-full border-t border-zinc-100 px-3 py-2 text-left font-medium text-red-700 hover:bg-red-50"
              role="menuitem"
            >
              {dictionary.library.removeList}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
