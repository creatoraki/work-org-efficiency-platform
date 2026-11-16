import React from "react";

export interface AdjustHistoryContextValue {
	currentIndicatorListId: string | null;
}

export const AdjustHistoryContext = React.createContext<AdjustHistoryContextValue>({
	currentIndicatorListId: null,
});
