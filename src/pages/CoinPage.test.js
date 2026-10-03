import { fireEvent, render, screen } from "@testing-library/react";
import { Converter } from "./CoinPage";

const coin = { symbol: "BTC", name: "Bitcoin", image: "", current_price: 50000 };
const labels = () => screen.getAllByRole("spinbutton").map((input) => input.getAttribute("aria-label"));

test("converter works both ways and swaps", () => {
  render(<Converter coin={coin} symbol="$" currency="USD" />);
  expect(labels()).toEqual(["Amount in BTC", "Amount in USD"]);
  expect(screen.getByLabelText("Amount in USD")).toHaveValue(50000);

  fireEvent.click(screen.getByRole("button", { name: "Swap BTC and USD" }));
  expect(labels()).toEqual(["Amount in USD", "Amount in BTC"]);

  fireEvent.change(screen.getByLabelText("Amount in USD"), { target: { value: "100" } });
  expect(screen.getByLabelText("Amount in BTC")).toHaveValue(0.002);

  fireEvent.change(screen.getByLabelText("Amount in BTC"), { target: { value: "0.5" } });
  expect(screen.getByLabelText("Amount in USD")).toHaveValue(25000);
});
