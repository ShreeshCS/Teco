import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { TextInput, Button, Message } from "../ui";
import { authService } from "@/services";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

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
	const navigate = useNavigate();
	const { signIn, isLoading } = useAuth();

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsError(false);

		try {
			const { user, token } = await authService.loginUser(form);
			console.log("Submitting login for:", form.email);

			if (user && token) {
				console.log("Login successful!");
				signIn(user, token);
				navigate("/chat", { replace: true }); // Replace browser history so that pressing back won't go to login page again if logged in
			}
		} catch (err) {
			setIsError(true);
			if (err instanceof Error) {
				setMessage("Something went wrong. Please try again in some time.");
			} else {
				setMessage("Invalid credentials. Please try again.");
			}
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
