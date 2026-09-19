type MessageProps = {
	text: string;
	isError?: boolean;
};

export default function Message({ text, isError = false }: MessageProps) {
	if (!text) return null;

	return <p className={isError ? "error-message" : "form-message"}>{text}</p>;
}
