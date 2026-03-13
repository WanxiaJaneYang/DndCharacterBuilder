type EntityChoiceStepProps = {
  title: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  limit: number;
  onChange: (nextSelected: string[]) => void;
};

export function EntityChoiceStep({
  title,
  options,
  selected,
  limit,
  onChange,
}: EntityChoiceStepProps) {
  if (limit <= 1) {
    const value = selected[0] ?? "";

    return (
      <section>
        <h2>{title}</h2>
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={title}
              checked={value === option.id}
              onChange={() => onChange([option.id])}
            />
            {option.label}
          </label>
        ))}
      </section>
    );
  }

  return (
    <section>
      <h2>{title}</h2>
      <fieldset>
        <legend>{title}</legend>
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              disabled={!selected.includes(option.id) && selected.length >= limit}
              onChange={(event) => {
                const nextSelected = event.target.checked
                  ? [...selected, option.id]
                  : selected.filter((item) => item !== option.id);
                onChange(nextSelected);
              }}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
