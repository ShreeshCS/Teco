import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { TextInput, Button, Message } from "../ui";
import { loginUser } from "../../services/auth/auth.service";

type LoginFormData = {
	email: string;
	password: string;
};

const initialForm: LoginFormData = {
	email: "",
	password: "",
};

export default function LoginForm() {
	const [form, setForm] = useState<LoginFormData>(initialForm);
	const [message, setMessage] = useState("");
	const [isError, setIsError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);
		setMessage("");
		setIsError(false);

		try {
			const isLoggedIn = await loginUser(form);
			console.log("Submitting login for:", form.email);

			if (isLoggedIn) {
				setMessage("Login successful!");
				setForm(initialForm);
			}
		} catch (err: unknown) {
			setIsError(true);
			if (err instanceof Error) {
				setMessage(err.message);
			} else {
				setMessage("Invalid credentials. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="login-page">
			<form className="login-card" onSubmit={handleSubmit}>
				<h1>Sign In</h1>

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

				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Signing in..." : "Login"}
				</Button>

				<Message text={message} isError={isError} />
			</form>
		</div>
	);
}
