import { type ReactNode } from "react";

type ButtonProps = {
	type?: "button" | "submit" | "reset";
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
};

export default function Button({
	type = "button",
	children,
	onClick,
	disabled = false,
	className,
}: ButtonProps) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={className}
		>
			{children}
		</button>
	);
}
