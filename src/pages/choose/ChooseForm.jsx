import FormField from "../../components/FormField.jsx";

// The "NamePancho" form. Markup and classes are the original ones; the
// error <span> of each field is rendered by <FormField />.
export default function ChooseForm({ formData, errors, handleChange }) {
    return (
        <section className="NamePancho mb-14">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
                <FormField
                    id="name"
                    label="Username:"
                    value={formData.name}
                    onChange={handleChange("name")}
                    error={errors.name}
                    inputClassName="w-full rounded px-3 py-2 shadow-md"
                />

                <FormField
                    id="password"
                    label="Password:"
                    type="password"
                    value={formData.password}
                    onChange={handleChange("password")}
                    error={errors.password}
                />

                <FormField
                    id="email"
                    label="E-mail:"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    error={errors.email}
                    inputClassName="w-full rounded px-3 py-2 shadow-md"
                />
            </form>
        </section>
    );
}
