import { render, screen } from "@testing-library/react";
import CryptoContext from "./CryptoContext";
import App from "./App";

test("renders app header", () => {
  render(
    <CryptoContext>
      <App />
    </CryptoContext>
  );
  expect(screen.getByText(/CryptoXplorers/i)).toBeInTheDocument();
});
