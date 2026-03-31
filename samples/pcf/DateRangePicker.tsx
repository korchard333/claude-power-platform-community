/**
 * DateRangePicker — React PCF Field Control Sample
 *
 * PATTERNS DEMONSTRATED:
 * 1. ReactControl<IInputs, IOutputs> (virtual control — no DOM container)
 * 2. Fluent UI v9 DatePicker with FluentProvider for theming
 * 3. notifyOutputChanged() on blur (not keystroke) to avoid excessive saves
 * 4. Property change diffing in updateView to prevent unnecessary re-renders
 * 5. destroy() cleanup for event listeners and timers
 * 6. Scoped styles via makeStyles (no global CSS leaks)
 * 7. Keyboard accessible with aria-label on inputs
 *
 * IMPORTANT:
 * - Platform provides React 16.14.0 (build) / 17.0.2 (MDA runtime)
 * - Do NOT use React 18 APIs (useTransition, useDeferredValue, etc.)
 * - Fluent UI v9 max version: ≤ 9.46.2
 * - control-type="virtual" is REQUIRED in ControlManifest.Input.xml
 */

import * as React from "react";
import {
  FluentProvider,
  webLightTheme,
  DatePicker,
  Label,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { IInputs, IOutputs } from "./generated/ManifestTypes";

// ---------------------------------------------------------------------------
// Styles (scoped via makeStyles — no global CSS pollution)
// ---------------------------------------------------------------------------
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
  },
  row: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
    flexWrap: "wrap",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    minWidth: "160px",
  },
});

// ---------------------------------------------------------------------------
// React Component (pure presentation — receives props, fires callbacks)
// ---------------------------------------------------------------------------
interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  disabled: boolean;
  onStartChange: (date: Date | null | undefined) => void;
  onEndChange: (date: Date | null | undefined) => void;
}

const DateRangePickerComponent: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  disabled,
  onStartChange,
  onEndChange,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="start-date">Start Date</Label>
          <DatePicker
            id="start-date"
            value={startDate}
            onSelectDate={onStartChange}
            disabled={disabled}
            maxDate={endDate ?? undefined}
            aria-label="Select start date"
            placeholder="Select start date..."
          />
        </div>
        <div className={styles.field}>
          <Label htmlFor="end-date">End Date</Label>
          <DatePicker
            id="end-date"
            value={endDate}
            onSelectDate={onEndChange}
            disabled={disabled}
            minDate={startDate ?? undefined}
            aria-label="Select end date"
            placeholder="Select end date..."
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PCF Control Class (ReactControl — virtual, no DOM container)
// ---------------------------------------------------------------------------
export class DateRangePicker
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  private notifyOutputChanged: () => void;
  private startDate: Date | null = null;
  private endDate: Date | null = null;

  // Cache the last-seen bound values to diff in updateView
  private lastBoundStart: Date | null = null;
  private lastBoundEnd: Date | null = null;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
  ): void {
    this.notifyOutputChanged = notifyOutputChanged;
    // Track container resize if layout is responsive
    context.mode.trackContainerResize(true);
  }

  /**
   * updateView is called by the platform when bound properties change.
   * RULE: Diff props before re-rendering to avoid flicker.
   * RULE: NEVER call notifyOutputChanged() here — causes infinite loops.
   */
  public updateView(
    context: ComponentFramework.Context<IInputs>,
  ): React.ReactElement {
    // Read bound property values from the platform
    const boundStart = context.parameters.startDate?.raw ?? null;
    const boundEnd = context.parameters.endDate?.raw ?? null;

    // Only update internal state if the platform-bound value actually changed
    // (avoids overwriting user edits that haven't been saved yet)
    if (boundStart !== this.lastBoundStart) {
      this.startDate = boundStart;
      this.lastBoundStart = boundStart;
    }
    if (boundEnd !== this.lastBoundEnd) {
      this.endDate = boundEnd;
      this.lastBoundEnd = boundEnd;
    }

    const disabled = context.mode.isControlDisabled;

    return React.createElement(
      FluentProvider,
      { theme: webLightTheme },
      React.createElement(DateRangePickerComponent, {
        startDate: this.startDate,
        endDate: this.endDate,
        disabled,
        onStartChange: (date: Date | null | undefined) => {
          this.startDate = date ?? null;
          // Notify on selection (not keystroke) — DatePicker fires onSelectDate on blur/pick
          this.notifyOutputChanged();
        },
        onEndChange: (date: Date | null | undefined) => {
          this.endDate = date ?? null;
          this.notifyOutputChanged();
        },
      }),
    );
  }

  public getOutputs(): IOutputs {
    return {
      startDate: this.startDate ?? undefined,
      endDate: this.endDate ?? undefined,
    };
  }

  /**
   * destroy() — Always implement cleanup.
   * Clear any event listeners, timers, or subscriptions here.
   */
  public destroy(): void {
    // No timers or listeners in this sample, but always implement this method.
    // If you had intervals or event listeners, clear them here.
  }
}
