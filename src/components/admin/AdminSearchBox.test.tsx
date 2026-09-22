import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AdminSearchBox } from "./AdminSearchBox";

const push = vi.fn();
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => currentParams,
}));

describe("AdminSearchBox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockClear();
    currentParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces typing before pushing the q param, and resets page", () => {
    currentParams = new URLSearchParams("page=3");
    render(<AdminSearchBox placeholder="Search..." />);

    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "sapphire" } });
    expect(push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(push).toHaveBeenCalledOnce();
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("q=sapphire");
    expect(url).not.toContain("page=");
  });

  it("clears the q param when the input is emptied", () => {
    currentParams = new URLSearchParams("q=old&page=2");
    render(<AdminSearchBox />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(push).toHaveBeenCalledWith("/admin/orders");
  });
});
