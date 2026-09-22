import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotificationBell } from "./NotificationBell";

vi.mock("@/actions/notifications", () => ({
  pollNotifications: vi.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
  markAllNotificationsRead: vi.fn(),
  dismissNotification: vi.fn(),
  dismissAllNotifications: vi.fn(),
}));
vi.mock("@/components/providers/MarketProvider", () => ({ useAppPathname: () => "/" }));

// Regression test: the bell's own wrapping div (needed for click-outside
// detection) used to be plain `relative`, a block-level box whose default
// line-box added a few px of height the cart icon's plain <Link> didn't
// have — pushing the bell visibly out of vertical alignment with every
// other navbar icon. `inline-flex` makes it size to its button exactly,
// like every sibling icon already does.
describe("NotificationBell", () => {
  it("wraps its button in an inline-flex container, not a plain block div", () => {
    render(<NotificationBell transparent={false} />);
    const button = screen.getByLabelText("Notifications");
    const wrapper = button.parentElement;
    expect(wrapper?.className).toContain("inline-flex");
  });
});
