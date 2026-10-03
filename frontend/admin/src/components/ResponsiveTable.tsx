import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
// Keep one table and one set of controls; on mobile each row becomes a labeled card.
export default function ResponsiveTable({
  headings,
  children,
  label,
}: {
  headings: string[];
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table" aria-label={label}>
        <thead>
          <tr>
            {headings.map((heading, index) => (
              <th key={index} scope="col">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Children.map(children, (row) => {
            if (!isValidElement<{ children?: ReactNode }>(row)) return row;
            return cloneElement(
              row,
              {},
              Children.map(row.props.children, (cell, index) => {
                if (!isValidElement(cell)) return cell;
                return cloneElement(
                  cell as ReactElement<Record<string, unknown>>,
                  { "data-label": headings[index] },
                );
              }),
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
