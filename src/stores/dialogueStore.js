import { create } from 'zustand';

/** 角色對話是否開啟（頭像選單、自動播放都呼叫 openDialogue） */
export const useDialogueStore = create(() => ({ isOpen: false }));

export const openDialogue = () => useDialogueStore.setState({ isOpen: true });
export const closeDialogue = () => useDialogueStore.setState({ isOpen: false });
