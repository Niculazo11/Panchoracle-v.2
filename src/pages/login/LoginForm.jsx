import FormField from "../../components/FormField.jsx";

// Same field markup as the join form on Home, so both pages look alike.
export default function LoginForm({ formData, errors, handleChange, handleSubmit }) {
    return (
        <form id="loginForm" onSubmit={handleSubmit} noValidate className="flex flex-col items-center gap-4 max-w-md w-full mx-auto text-left">

            <FormField id="loginName" label="Name:" value={formData.name} onChange={handleChange("name")} error={errors.name} />

            <FormField id="loginEmail" label="Email:" type="email" value={formData.email} onChange={handleChange("email")} error={errors.email} />

            <FormField id="loginPassword" label="Password:" type="password" value={formData.password} onChange={handleChange("password")} error={errors.password} />

            <FormField id="loginConfirmPassword" label="Confirm password:" type="password" value={formData.confirmPassword} onChange={handleChange("confirmPassword")} error={errors.confirmPassword} />

            <button type="submit" className="inline-block px-5 py-2 bg-[rgb(21,116,62)] dark:bg-[#5d7467] text-white rounded">Log in</button>
        </form>
    );
}
