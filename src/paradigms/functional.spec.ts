import { Invoice, computeInvoicePrice } from "./functional";

describe("Invoice (functional)", function() {
  it("should initialize the total price when there is no line", function() {
    const invoice: Invoice = {
      lines: []
    };
    expect(computeInvoicePrice(invoice)).toEqual(0);
  });

  it("should allow to add one single unit of a reference and compute the invoice price accordingly", function() {
    const invoice: Invoice = {
      lines: [
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 50
          },
          quantity: 1
        }
      ]
    };
    expect(computeInvoicePrice(invoice)).toEqual(50);
  });

  it("should allow to add two units of the same reference and compute the invoice price accordingly", function() {
    const invoice: Invoice = {
      lines: [
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 50
          },
          quantity: 2
        }
      ]
    };
    expect(computeInvoicePrice(invoice)).toEqual(100);
  });

  it("should allow to add many units of various references and compute the invoice price accordingly", function() {
    const invoice: Invoice = {
      lines: [
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 50
          },
          quantity: 2
        },
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 30
          },
          quantity: 1
        }
      ]
    };
    expect(computeInvoicePrice(invoice)).toEqual(130);
  });
});
