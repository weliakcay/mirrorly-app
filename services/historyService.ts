
import { HistoryItem, Garment } from "../types";

const HISTORY_KEY = 'mirrorly_user_history';

export const saveToHistory = (garment: Garment, resultImageUrl: string) => {
  try {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      garment: garment,
      resultImageUrl: resultImageUrl
    };

    const existingHistoryJson = localStorage.getItem(HISTORY_KEY);
    const history: HistoryItem[] = existingHistoryJson ? JSON.parse(existingHistoryJson) : [];

    // Add new item to the beginning
    const updatedHistory = [newItem, ...history];

    // Limit to last 20 items to save storage
    const limitedHistory = updatedHistory.slice(0, 20);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = (): HistoryItem[] => {
  try {
    const json = localStorage.getItem(HISTORY_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
