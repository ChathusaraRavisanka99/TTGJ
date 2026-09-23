import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderSearch } from "./HeaderSearch";
import { getSearchSuggestionsForHeader } from "@/actions/search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/providers/MarketProvider", () => ({ useMarket: () => "intl" }));
vi.mock("@/actions/search", () => ({ getSearchSuggestionsForHeader: vi.fn() }));

const suggestion = { id: "gem-1", slug: "blue-sapphire", name: "Ceylon Blue Sapphire", imageUrl: null, price: 5000, currency: "USD" as const };

describe("HeaderSearch", () => {
  beforeEach(() => {
    push.mockClear();
    vi.mocked(getSearchSuggestionsForHeader).mockResolvedValue({ gems: [], jewelry: [] });
  });

  it("opens an overlay with a dialog role when the search icon is clicked", async () => {
    const user = userEvent.setup();
    render(<HeaderSearch transparent={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Search"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("debounces typing before fetching suggestions, and skips anything under 2 characters", async () => {
    vi.useFakeTimers();
    render(<HeaderSearch transparent={false} />);
    fireEvent.click(screen.getByLabelText("Search"));

    fireEvent.change(screen.getByPlaceholderText("Search gems, jewelry..."), { target: { value: "s" } });
    act(() => vi.advanceTimersByTime(400));
    expect(getSearchSuggestionsForHeader).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Search gems, jewelry..."), { target: { value: "sapphire" } });
    act(() => vi.advanceTimersByTime(400));
    expect(getSearchSuggestionsForHeader).toHaveBeenCalledWith("sapphire");
    vi.useRealTimers();
  });

  it("shows matching suggestions and navigates to the item on click, closing the overlay", async () => {
    vi.mocked(getSearchSuggestionsForHeader).mockResolvedValue({ gems: [suggestion], jewelry: [] });
    const user = userEvent.setup();
    render(<HeaderSearch transparent={false} />);
    await user.click(screen.getByLabelText("Search"));
    fireEvent.change(screen.getByPlaceholderText("Search gems, jewelry..."), { target: { value: "sapphire" } });

    await waitFor(() => expect(screen.getByText("Ceylon Blue Sapphire")).toBeInTheDocument());
    await user.click(screen.getByText("Ceylon Blue Sapphire"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it('"View all results" navigates to the full search page', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch transparent={false} />);
    await user.click(screen.getByLabelText("Search"));
    fireEvent.change(screen.getByPlaceholderText("Search gems, jewelry..."), { target: { value: "sapphire" } });

    await waitFor(() => expect(screen.getByText(/View all results/)).toBeInTheDocument());
    await user.click(screen.getByText(/View all results/));

    expect(push).toHaveBeenCalledWith("/search?q=sapphire");
  });
});
