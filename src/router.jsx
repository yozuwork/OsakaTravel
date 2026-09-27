import { lazy } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import AppLayout from './components/layout/AppLayout';

// 各頁面按需載入
const ItineraryPage = lazy(() => import('./pages/itinerary/ItineraryPage'));
const TodoLayout = lazy(() => import('./pages/todo/TodoLayout'));
const TodoListTab = lazy(() => import('./pages/todo/TodoListTab'));
const FlightTab = lazy(() => import('./pages/todo/FlightTab'));
const EntryTab = lazy(() => import('./pages/todo/EntryTab'));
const StayTab = lazy(() => import('./pages/todo/StayTab'));
const BagTab = lazy(() => import('./pages/todo/BagTab'));
const MapPage = lazy(() => import('./pages/map/MapPage'));
const IdeasPage = lazy(() => import('./pages/ideas/IdeasPage'));

// 使用 Hash 路由（#/itinerary）：靜態空間直接部署、不需要伺服器設定
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/itinerary" replace /> },
      { path: 'itinerary', element: <ItineraryPage />, handle: { title: '行程' } },
      {
        path: 'todo',
        element: <TodoLayout />,
        handle: { title: '待辦與清單' },
        children: [
          { index: true, element: <TodoListTab /> },
          { path: 'flight', element: <FlightTab /> },
          { path: 'entry', element: <EntryTab /> },
          { path: 'stay', element: <StayTab /> },
          { path: 'bag', element: <BagTab /> }
        ]
      },
      { path: 'map', element: <MapPage />, handle: { title: '地圖' } },
      { path: 'ideas', element: <IdeasPage />, handle: { title: '收集箱' } },
      { path: '*', element: <Navigate to="/itinerary" replace /> }
    ]
  }
]);
