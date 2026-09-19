import { type ChangeEvent } from "react";

type TextInputProps = {
	label: string;
	name: string;
	type?: "text" | "email" | "password";
	value: string;
	placeholder?: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	required?: boolean;
};

export default function TextInput({
	label,
	name,
	type = "text",
	value,
	placeholder,
	onChange,
	required = false,
}: TextInputProps) {
	return (
		<label>
			{label}
			<input
				name={name}
				type={type}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
			/>
		</label>
	);
}
