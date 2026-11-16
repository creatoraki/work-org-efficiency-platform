import type {
	OrgAdjustmentTaskChildIdLike,
	OrgAdjustmentTaskCompareMeta,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";

const COMPARE_META_ID_KEYS = ["orgId", "childOrgId", "id", "value", "targetOrgId"] as const;
const TEMP_ORG_ID_PREFIX = "temp-org-";

export function normalizeOrgId(value: unknown) {
	if (value === null || value === undefined) {
		return "";
	}

	return String(value).trim();
}

export function normalizeOptionalOrgId(value: unknown) {
	const normalizedId = normalizeOrgId(value);
	return normalizedId || undefined;
}

function extractCompareMetaChildId(value: OrgAdjustmentTaskChildIdLike) {
	if (typeof value === "string" || typeof value === "number") {
		return normalizeOptionalOrgId(value);
	}

	for (const key of COMPARE_META_ID_KEYS) {
		const candidate = normalizeOptionalOrgId(value[key]);
		if (candidate) {
			return candidate;
		}
	}

	return undefined;
}

export function normalizeCompareMetaChildIds(
	childIds: OrgAdjustmentTaskChildIdLike[] | null | undefined,
) {
	if (!Array.isArray(childIds) || !childIds.length) {
		return [] as string[];
	}

	const result: string[] = [];
	const seenIds = new Set<string>();

	childIds.forEach((item) => {
		const normalizedId = extractCompareMetaChildId(item);
		if (!normalizedId || seenIds.has(normalizedId)) {
			return;
		}

		seenIds.add(normalizedId);
		result.push(normalizedId);
	});

	return result;
}

export function normalizeCompareMeta(compareMeta: OrgAdjustmentTaskCompareMeta | null | undefined) {
	if (!compareMeta) {
		return null;
	}

	return {
		beforeChildIds: normalizeCompareMetaChildIds(compareMeta.beforeChildIds),
		afterChildIds: normalizeCompareMetaChildIds(compareMeta.afterChildIds),
		beforeEffectiveChildIds: compareMeta.beforeEffectiveChildIds
			? normalizeCompareMetaChildIds(compareMeta.beforeEffectiveChildIds)
			: undefined,
		afterEffectiveChildIds: compareMeta.afterEffectiveChildIds
			? normalizeCompareMetaChildIds(compareMeta.afterEffectiveChildIds)
			: undefined,
	} satisfies OrgAdjustmentTaskCompareMeta;
}

export function cloneCompareMeta(compareMeta: OrgAdjustmentTaskCompareMeta | null | undefined) {
	const normalizedCompareMeta = normalizeCompareMeta(compareMeta);
	if (!normalizedCompareMeta) {
		return null;
	}

	return {
		beforeChildIds: [...normalizedCompareMeta.beforeChildIds],
		afterChildIds: [...normalizedCompareMeta.afterChildIds],
		beforeEffectiveChildIds: normalizedCompareMeta.beforeEffectiveChildIds
			? [...normalizedCompareMeta.beforeEffectiveChildIds]
			: undefined,
		afterEffectiveChildIds: normalizedCompareMeta.afterEffectiveChildIds
			? [...normalizedCompareMeta.afterEffectiveChildIds]
			: undefined,
	} satisfies OrgAdjustmentTaskCompareMeta;
}

export function createTempOrgId(existingIds: Iterable<unknown>) {
	const usedIds = new Set(Array.from(existingIds, normalizeOrgId));
	let sequence = 1;

	while (usedIds.has(`${TEMP_ORG_ID_PREFIX}${sequence}`)) {
		sequence += 1;
	}

	return `${TEMP_ORG_ID_PREFIX}${sequence}`;
}
