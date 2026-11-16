import type { PolylineStyleProps } from "@antv/g6";
import { Polyline } from "@antv/g6";

type EdgePoint = [number, number];

function isCollinear(previousPoint: EdgePoint, currentPoint: EdgePoint, nextPoint: EdgePoint) {
	const crossProduct =
		(currentPoint[0] - previousPoint[0]) * (nextPoint[1] - currentPoint[1]) -
		(currentPoint[1] - previousPoint[1]) * (nextPoint[0] - currentPoint[0]);
	return Math.abs(crossProduct) < 0.001;
}

function getManhattanDistance(previousPoint: EdgePoint, nextPoint: EdgePoint) {
	return Math.abs(nextPoint[0] - previousPoint[0]) + Math.abs(nextPoint[1] - previousPoint[1]);
}

function buildRoundedOrthPath(points: EdgePoint[], radius: number): any {
	const path: any = [["M", points[0][0], points[0][1]]];

	for (let index = 1; index < points.length - 1; index += 1) {
		const previousPoint = points[index - 1];
		const currentPoint = points[index];
		const nextPoint = points[index + 1];
		const distanceToPrevious = getManhattanDistance(previousPoint, currentPoint);
		const distanceToNext = getManhattanDistance(currentPoint, nextPoint);

		if (
			!radius ||
			!distanceToPrevious ||
			!distanceToNext ||
			isCollinear(previousPoint, currentPoint, nextPoint)
		) {
			path.push(["L", currentPoint[0], currentPoint[1]]);
			continue;
		}

		const effectiveRadius = Math.min(radius, distanceToPrevious / 2, distanceToNext / 2);
		const roundedStart: EdgePoint = [
			currentPoint[0] -
				(effectiveRadius / distanceToPrevious) * (currentPoint[0] - previousPoint[0]),
			currentPoint[1] -
				(effectiveRadius / distanceToPrevious) * (currentPoint[1] - previousPoint[1]),
		];
		const roundedEnd: EdgePoint = [
			currentPoint[0] - (effectiveRadius / distanceToNext) * (currentPoint[0] - nextPoint[0]),
			currentPoint[1] - (effectiveRadius / distanceToNext) * (currentPoint[1] - nextPoint[1]),
		];

		path.push(
			["L", roundedStart[0], roundedStart[1]],
			["Q", currentPoint[0], currentPoint[1], roundedEnd[0], roundedEnd[1]],
		);
	}

	const lastPoint = points[points.length - 1];
	path.push(["L", lastPoint[0], lastPoint[1]]);

	return path;
}

export class RoundedOrthPolyline extends Polyline {
	protected getKeyPath(attributes: Required<PolylineStyleProps>): any {
		const points = this.getPoints(attributes) as EdgePoint[];
		const radius = Number(attributes?.radius ?? 0);

		if (points.length < 3 || radius <= 0) {
			return super.getKeyPath(attributes);
		}

		return buildRoundedOrthPath(points, radius);
	}
}
