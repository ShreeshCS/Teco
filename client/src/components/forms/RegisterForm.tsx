import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { TextInput, Button, Message } from "../ui";
import type { RegistrationUserData } from "../../types/auth.types";
import { registerUser } from "../../services/auth/auth.service";

const initialForm: RegistrationUserData = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

export default function RegisterForm() {
	const [form, setForm] = useState<RegistrationUserData>(initialForm);
	const [message, setMessage] = useState("");
	const [isError, setIsError] = useState(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (form.password !== form.confirmPassword) {
			setMessage("Passwords do not match.");
			setIsError(true);
			return;
		}

		setIsError(false);
		const userDetails = await registerUser(form);
		setMessage(`Welcome, ${form.name || "friend"}! Your account is ready.`);
		setForm(initialForm);
		console.log("User registered successfully:", userDetails);
	};

	return (
		<div className="register-page">
			<form className="register-card" onSubmit={handleSubmit}>
				<h1>Create account</h1>

				<TextInput
					label="Full name"
					name="name"
					type="text"
					value={form.name}
					onChange={handleChange}
					placeholder="Name"
					required
				/>

				<TextInput
					label="Email"
					name="email"
					type="email"
					value={form.email}
					onChange={handleChange}
					placeholder="abc@example.com"
					required
				/>

				<TextInput
					label="Password"
					name="password"
					type="password"
					value={form.password}
					onChange={handleChange}
					placeholder="Enter password"
					required
				/>

				<TextInput
					label="Confirm password"
					name="confirmPassword"
					type="password"
					value={form.confirmPassword}
					onChange={handleChange}
					placeholder="Confirm password"
					required
				/>

				<Button type="submit">Register</Button>

				<Message text={message} isError={isError} />
			</form>
		</div>
	);
}
