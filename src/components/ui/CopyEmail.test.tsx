import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyEmail } from "./CopyEmail";

const EMAIL = "someone@example.com";

/**
 * Replaces `navigator.clipboard` for one test and restores it afterwards.
 *
 * Must be called *after* `userEvent.setup()`: user-event installs its own
 * clipboard stub during setup, which would otherwise silently replace this one
 * and make the assertions test user-event rather than the component.
 */
function stubClipboard(writeText: () => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return () => {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else Reflect.deleteProperty(navigator as object, "clipboard");
  };
}

let restore: (() => void) | undefined;
afterEach(() => {
  restore?.();
  restore = undefined;
});

describe("CopyEmail", () => {
  it("writes the address to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    restore = stubClipboard(writeText);

    render(<CopyEmail email={EMAIL} />);
    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith(EMAIL);
  });

  it("announces success in a live region, not only as a visual tick", async () => {
    const user = userEvent.setup();
    restore = stubClipboard(() => Promise.resolve());

    render(<CopyEmail email={EMAIL} />);
    const status = screen.getByRole("status");
    // The region exists before the event, so the announcement is not missed.
    expect(status).toHaveTextContent("");

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(status).toHaveTextContent(/copied to clipboard/i));
  });

  it("reports a rejected write instead of silently doing nothing", async () => {
    // writeText rejects without a user gesture, over plain HTTP, and under
    // some permission policies. A visitor who believes they have the address
    // when they do not is worse off than one who can see it failed.
    const user = userEvent.setup();
    restore = stubClipboard(() => Promise.reject(new Error("denied")));

    render(<CopyEmail email={EMAIL} />);
    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/could not copy/i),
    );
    expect(screen.getByRole("button")).toHaveTextContent("Failed");
  });

  it("keeps one stable accessible name through every state", async () => {
    const user = userEvent.setup();
    restore = stubClipboard(() => Promise.resolve());

    render(<CopyEmail email={EMAIL} />);
    const name = new RegExp(`Copy email address ${EMAIL}`);

    expect(screen.getByRole("button", { name })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name }));
    // A control that renames itself to "Copied" is one the user can no longer
    // refer to by name.
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  it("never renders the address as visible text, which would duplicate it", () => {
    restore = stubClipboard(() => Promise.resolve());
    const { container } = render(<CopyEmail email={EMAIL} />);
    expect(container.querySelector("button")?.textContent).not.toContain(EMAIL);
  });
});
