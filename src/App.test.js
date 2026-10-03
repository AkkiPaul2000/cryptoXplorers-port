import { render, screen } from "@testing-library/react";
import CryptoContext from "./CryptoContext";
import App from "./App";

test("renders app header", () => {
  render(
    <CryptoContext>
      <App />
    </CryptoContext>
  );
  expect(screen.getByLabelText(/CryptoXplorers home/i)).toBeInTheDocument();
});
