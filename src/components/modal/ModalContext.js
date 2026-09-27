import { createContext, useContext } from 'react';

export const ModalContext = createContext({ id: null, close: () => {} });

/** 在彈出視窗內容中取得 { id, close } */
export const useModalContext = () => useContext(ModalContext);
