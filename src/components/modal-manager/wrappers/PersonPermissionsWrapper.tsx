import React from "react";
import PersonPermissionsModal from "../../../../src/pages/strategy/target-management/modal/Person-permissions-modal";

export default function PersonPermissionsWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return <PersonPermissionsModal open={true} person={props?.person} onClose={onClose} />;
}
