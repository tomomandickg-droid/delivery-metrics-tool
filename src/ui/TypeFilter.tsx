interface TypeFilterProps {
  /** Every Issue Type in the file, alphabetical, with how many issues have it. */
  readonly types: readonly { readonly type: string; readonly count: number }[];
  readonly selected: ReadonlySet<string>;
  readonly onChange: (selected: ReadonlySet<string>) => void;
}

/** Multi-select Issue Type filter (owner decision 8): checkboxes plus Select all / Clear. */
export function TypeFilter({ types, selected, onChange }: TypeFilterProps) {
  const toggle = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    onChange(next);
  };

  return (
    <fieldset className="filter">
      <legend>Issue type</legend>
      {types.map(({ type, count }) => (
        <label key={type} className="checkbox">
          <input type="checkbox" checked={selected.has(type)} onChange={() => toggle(type)} />
          {type === '' ? '(no type)' : type}
          <span className="count">{count}</span>
        </label>
      ))}
      <button
        type="button"
        className="button button-small"
        onClick={() => onChange(new Set(types.map((t) => t.type)))}
        disabled={selected.size === types.length}
      >
        Select all
      </button>
      <button
        type="button"
        className="button button-small"
        onClick={() => onChange(new Set())}
        disabled={selected.size === 0}
      >
        Clear
      </button>
    </fieldset>
  );
}
