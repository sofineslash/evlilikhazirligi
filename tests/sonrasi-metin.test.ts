import { describe, it, expect } from "vitest";
import { paragraflar, VARSAYILAN_TESEKKUR, SONRA_BASLIK } from "../lib/sonrasi-metin";

describe("lib/sonrasi-metin", () => {
  it("boş satırla paragraf böler, tek satır sonunu boşluğa çevirir", () => {
    expect(paragraflar("Bir\nsatır.\n\nİki.")).toEqual(["Bir satır.", "İki."]);
  });
  it("fazla boş satır ve boşlukları yutar", () => {
    expect(paragraflar("\n\n  A  \n\n\n\n B \n")).toEqual(["A", "B"]);
    expect(paragraflar("   ")).toEqual([]);
  });
  it("hazır metinler üç paragraf ve başlıklar doğru", () => {
    expect(paragraflar(VARSAYILAN_TESEKKUR.nisan)).toHaveLength(3);
    expect(paragraflar(VARSAYILAN_TESEKKUR.dugun)).toHaveLength(3);
    expect(SONRA_BASLIK).toEqual({ nisan: "Nişanlandık", dugun: "Evlendik" });
  });
});
