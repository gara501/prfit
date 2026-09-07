import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrainerClientChat } from "./TrainerClientChat";

const send = vi.fn().mockResolvedValue(true);
const markIncomingAsRead = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/useTrainerClientMessages", () => ({
  useTrainerClientMessages: () => ({
    messages: [
      {
        id: "message-1",
        body: "Perfecto, lo reviso.",
        senderId: "trainer-1",
        sentAt: "2026-09-06T12:00:00.000Z",
        readAt: null,
      },
    ],
    isSending: false,
    error: null,
    send,
    markIncomingAsRead,
  }),
}));

describe("TrainerClientChat", () => {
  afterEach(() => cleanup());

  it("muestra el historial y registra un mensaje al enviarlo", async () => {
    const user = userEvent.setup();
    render(
      <TrainerClientChat
        currentUserId="client-1"
        trainerId="trainer-1"
        clientId="client-1"
        contactName="Ana Trainer"
        initialMessages={[]}
      />,
    );
    expect(screen.getByText("Perfecto, lo reviso.")).toBeInTheDocument();
    expect(markIncomingAsRead).toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Escribe un mensaje"),
      "¿Podemos cambiar el ejercicio?",
    );
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    expect(send).toHaveBeenCalledWith("¿Podemos cambiar el ejercicio?");
  });

  it("impide enviar un mensaje vacío", () => {
    render(
      <TrainerClientChat
        currentUserId="client-1"
        trainerId="trainer-1"
        clientId="client-1"
        contactName="Ana Trainer"
        initialMessages={[]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Enviar mensaje" }),
    ).toBeDisabled();
  });
});
