import { useState, type ChangeEvent, type SubmitEvent } from "react";

type RegisterFormState = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
};

const initialForm: RegisterFormState = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

export default function RegisterForm() {
	const [form, setForm] = useState<RegisterFormState>(initialForm);
	const [message, setMessage] = useState("");
	const [isError, setIsError] = useState(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (form.password !== form.confirmPassword) {
			setMessage("Passwords do not match.");
			setIsError(true);
			return;
		}

        setIsError(false);
		setMessage(`Welcome, ${form.name || "friend"}! Your account is ready.`);
		setForm(initialForm);
	};

	return (
		<div className="register-page">
			<form className="register-card" onSubmit={handleSubmit}>
				<h1>Create account</h1>

				<label>
					Full name
					<input
						name="name"
						type="text"
						value={form.name}
						onChange={handleChange}
						placeholder="Name"
						required
					/>
				</label>

				<label>
					Email
					<input
						name="email"
						type="email"
						value={form.email}
						onChange={handleChange}
						placeholder="abc@example.com"
						required
					/>
				</label>

				<label>
					Password
					<input
						name="password"
						type="password"
						value={form.password}
						onChange={handleChange}
						placeholder="Enter password"
						required
					/>
				</label>

				<label>
					Confirm password
					<input
						name="confirmPassword"
						type="password"
						value={form.confirmPassword}
						onChange={handleChange}
						placeholder="Confirm password"
						required
					/>
				</label>

				<button type="submit">Register</button>

				{message ? (
					<p className={isError ? "error-message" : "form-message"}>
						{message}
					</p>
				) : null}
			</form>
		</div>
	);
}
