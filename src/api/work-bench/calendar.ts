import type {
	AddCalendarParams,
	CalendarListParams,
	CalendarListRes,
	UpdateCalendarParams,
} from "./types";
import { request } from "#src/utils";

export type {
	AddCalendarParams,
	CalendarItem,
	CalendarListParams,
	CalendarListRes,
	UpdateCalendarParams,
} from "./types";

export async function getCalendarList(params: CalendarListParams) {
	const url = "efficiency/calendar/list";
	const resp: CalendarListRes = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

export async function addCalendar(data: AddCalendarParams) {
	const url = "efficiency/calendar";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: data,
			errorMessage: true,
		})
		.json();
	return resp;
}

export async function deleteCalendar(ids: string) {
	const url = `efficiency/calendar/${ids}`;
	const resp: ApiResponse<boolean> = await request
		.delete(url, {
			errorMessage: true,
		})
		.json();
	return resp;
}

export async function updateCalendar(data: UpdateCalendarParams) {
	const url = "efficiency/calendar";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: data,
			errorMessage: true,
		})
		.json();
	return resp;
}
