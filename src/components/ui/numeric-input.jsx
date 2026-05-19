import * as React from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

/** Full-width digits → ASCII 0–9 */
function normalizeDigitChars(str) {
  if (typeof str !== "string" || !str) return str;
  return str.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
}

/**
 * True only for real IME text (Vietnamese/Chinese words), not bare digit keys.
 * Windows + Vietnamese keyboard often fires composition events for 0–9 without e.data.
 */
function isImeComposing(e) {
  const data = e?.data;
  return typeof data === "string" && data.length > 0 && !/^\d$/.test(data);
}

/**
 * Numeric input with thousand-separator formatting (vi-VN style: 12.000).
 *
 * @param {string|number} value
 * @param {function} onChange - raw numeric string (e.g. "12000")
 * @param {boolean} [formatted=true]
 * @param {number} [decimalScale=0]
 * @param {number} [max]
 */
const NumericInput = React.forwardRef(
  (
    { value, onChange, formatted = true, decimalScale = 0, max, ...props },
    ref,
  ) => {
    const composingRef = React.useRef(false);
    const pendingRawRef = React.useRef(null);

    const flushPending = React.useCallback(() => {
      const pending = pendingRawRef.current;
      if (pending == null) return;
      pendingRawRef.current = null;
      onChange?.(pending);
    }, [onChange]);

    const onValueChange = React.useCallback(
      (values) => {
        const raw = normalizeDigitChars(values.value ?? "");
        if (composingRef.current) {
          pendingRawRef.current = raw;
          return;
        }
        pendingRawRef.current = null;
        onChange?.(raw);
      },
      [onChange],
    );

    const inputMode = decimalScale > 0 ? "decimal" : "numeric";

    const {
      onCompositionStart: onCompositionStartProp,
      onCompositionEnd: onCompositionEndProp,
      ...restProps
    } = props;

    const shared = {
      ...restProps,
      getInputRef: ref,
      customInput: Input,
      allowNegative: false,
      decimalScale,
      value: value === "" || value == null ? "" : String(value),
      onValueChange,
      lang: "en",
      spellCheck: false,
      autoComplete: "off",
      inputMode,
      onCompositionStart: (e) => {
        if (isImeComposing(e)) {
          composingRef.current = true;
        }
        onCompositionStartProp?.(e);
      },
      onCompositionEnd: (e) => {
        if (composingRef.current) {
          composingRef.current = false;
          flushPending();
        }
        onCompositionEndProp?.(e);
      },
    };

    if (decimalScale > 0) {
      return (
        <NumericFormat
          {...shared}
          thousandSeparator={formatted ? "." : false}
          decimalSeparator=","
          allowedDecimalSeparators={[",", "."]}
          isAllowed={
            max !== undefined
              ? ({ floatValue }) => (floatValue ?? 0) <= max
              : undefined
          }
        />
      );
    }

    if (!formatted) {
      return (
        <NumericFormat
          {...shared}
          isAllowed={
            max !== undefined
              ? ({ floatValue }) => (floatValue ?? 0) <= max
              : undefined
          }
        />
      );
    }

    return (
      <NumericFormat
        {...shared}
        thousandSeparator="."
        decimalSeparator=","
        isAllowed={
          max !== undefined
            ? ({ floatValue }) => (floatValue ?? 0) <= max
            : undefined
        }
      />
    );
  },
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
