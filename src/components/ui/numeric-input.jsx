import * as React from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

/**
 * Numeric input with thousand-separator formatting (vi-VN style: 12.000).
 *
 * Props:
 * @param {string|number} value       - Raw numeric value (unformatted)
 * @param {function}      onChange    - Called with raw numeric string (e.g. "12000")
 * @param {boolean}       [formatted=true] - Enable dot thousand separators
 * @param {number}        [max]       - Clamp value to this ceiling
 * All other props forwarded to <Input>.
 */
const NumericInput = React.forwardRef(
  ({ value, onChange, formatted = true, max, ...props }, ref) => {
    if (!formatted) {
      // Plain integer input without formatting
      return (
        <NumericFormat
          getInputRef={ref}
          customInput={Input}
          allowNegative={false}
          decimalScale={0}
          isAllowed={
            max !== undefined
              ? ({ floatValue }) => (floatValue ?? 0) <= max
              : undefined
          }
          value={value === "" ? "" : value}
          onValueChange={({ value: raw }) => onChange?.(raw)}
          {...props}
        />
      );
    }

    return (
      <NumericFormat
        getInputRef={ref}
        customInput={Input}
        thousandSeparator="."
        decimalSeparator=","
        allowNegative={false}
        decimalScale={0}
        isAllowed={
          max !== undefined
            ? ({ floatValue }) => (floatValue ?? 0) <= max
            : undefined
        }
        value={value === "" ? "" : value}
        onValueChange={({ value: raw }) => onChange?.(raw)}
        {...props}
      />
    );
  },
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
