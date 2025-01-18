import { toast as toastify } from "react-toastify";

const notifySuccess = (message: string) =>
	toastify.success(message, {
		position: "top-center",
		autoClose: 3000,
		hideProgressBar: false,
		closeOnClick: true,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
	});

const notifyError = (message: string) =>
	toastify.error(message, {
		position: "top-center",
		autoClose: 3000,
		hideProgressBar: false,
		closeOnClick: true,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
	});

export { notifySuccess, notifyError };
