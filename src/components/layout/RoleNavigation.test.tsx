import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleNavigation } from "./RoleNavigation";

let pathname = "/trainer/routines";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("RoleNavigation", () => {
  beforeEach(() => {
    pathname = "/trainer/routines";
  });

  it("shows the current section in the compact trigger and opens a vertical menu", async () => {
    const user = userEvent.setup();
    render(<RoleNavigation userRole="trainer" />);

    const trigger = screen.getByRole("button", {
      name: /Rutinas.*Navegar/i,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link", { name: /Clientes/i })).not.toHaveLength(
      0,
    );
    expect(
      screen.getAllByRole("link", { name: /Ejercicios/i }),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByRole("link", { name: /Mi perfil/i }),
    ).not.toHaveLength(0);
  });

  it("closes an open menu with Escape", async () => {
    const user = userEvent.setup();
    render(<RoleNavigation userRole="client" />);

    const trigger = screen.getByRole("button", {
      name: /Menú.*Navegar/i,
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("only exposes periodization to trainers", async () => {
    const user = userEvent.setup();
    const adminView = render(<RoleNavigation userRole="admin" />);

    await user.click(
      within(adminView.container).getByRole("button", {
        name: /Navegar/i,
      }),
    );
    expect(
      within(adminView.container).queryByRole("link", {
        name: /Periodización/i,
      }),
    ).not.toBeInTheDocument();

    adminView.unmount();
    const trainerView = render(<RoleNavigation userRole="trainer" />);
    await user.click(
      within(trainerView.container).getByRole("button", {
        name: /Navegar/i,
      }),
    );
    expect(
      within(trainerView.container).getByRole("link", {
        name: /Periodización/i,
      }),
    ).toHaveAttribute("href", "/trainer/periodization");
  });
});
