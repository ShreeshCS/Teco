import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../components/forms/RegisterForm";
import { registerUser } from "../services/auth/auth.service";

vi.mock("../services/auth/auth.service", () => ({
  registerUser: vi.fn(),
}));


const mockedRegisterUser = vi.mocked(registerUser);
const getRegisterButton = () =>
  screen.getByRole("button", { name: "Register" });

async function fillForm(confirmPassword = "secret123") {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Full name"), "Ava Chen");
  await user.type(screen.getByLabelText("Email"), "ava@example.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.type(
    screen.getByLabelText("Confirm password"),
    confirmPassword,
  );

  return user;
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows all required fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Full name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Confirm password")).toBeRequired();
  });

  it("shows an error and does not register when passwords do not match", async () => {
    render(<RegisterForm />);
    const user = await fillForm("different123");

    await user.click(getRegisterButton());

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });

  it("registers matching passwords, shows success, and clears the form", async () => {
    mockedRegisterUser.mockResolvedValueOnce({
      id: "user-1",
      name: "Ava Chen",
      email: "ava@example.com",
      createdAt: "2026-10-13",
    });

    render(<RegisterForm />);
    const user = await fillForm();

    await user.click(getRegisterButton());

    expect(
      await screen.findByText(
        "Welcome, Ava Chen! Your account is ready.",
      ),
    ).toBeInTheDocument();

    expect(mockedRegisterUser).toHaveBeenCalledOnce();
    expect(mockedRegisterUser).toHaveBeenCalledWith({
      name: "Ava Chen",
      email: "ava@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(screen.getByLabelText("Full name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm password")).toHaveValue("");
  });
});