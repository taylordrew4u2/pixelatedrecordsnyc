import type { MenuCategory, SiteContent } from "./types";

// Transcribed from the owner-supplied menu dated October 26, 2026.
// These defaults initialize new stores; existing menus remain admin-editable.
function category(
  id: string,
  title: string,
  description: string,
  rows: [string, string, string][],
): MenuCategory {
  return {
    id,
    title,
    description,
    visible: true,
    items: rows.map(([name, price, description], index) => ({
      id: `${id}-${index + 1}`,
      name,
      price,
      description,
      available: true,
      image: "",
    })),
  };
}

export const confirmedBarMenu: SiteContent["bar"] = {
  intro:
    "Cocktails, wine, beer, zero-proof drinks, and coffee at Pixelated Records in Ridgewood, Queens.",
  menuNotice:
    "Menu dated October 26, 2026. Ask at the bar about availability and premium spirit pricing.",
  categories: [
    category("specialty-cocktails", "Specialty cocktails", "", [
      [
        "Gucci Lemonade",
        "$13",
        "Gin · Vermouth · Lemon · Simple Syrup · Bitters · Sparkling Water",
      ],
      [
        "Whiskey Winehouse",
        "$13",
        "Whiskey · Red Wine · Lemon · Simple Syrup · Cardamom",
      ],
      [
        "Cherry Funk",
        "$13",
        "Rum · Elderflower · Cherry Blossom · Coconut · Lemon · Pineapple · Ginger Beer",
      ],
    ]),
    category(
      "classic-cocktails",
      "Classic cocktails",
      "Ask about premium spirit pricing.",
      [
        ["Margarita", "$12", "Flavored +$1"],
        ["Gimlet", "$12", ""],
        ["Mojito", "$12", ""],
        ["Paloma", "$13", ""],
        ["Tom Collins", "$13", ""],
        ["Negroni", "$13", ""],
        ["Moscow Mule", "$13", ""],
        ["Old Fashioned", "$13", ""],
        ["Manhattan", "$13", ""],
        ["Sidecar", "$15", ""],
      ],
    ),
    category("sparkling-cocktails", "Sparkling cocktails", "", [
      ["Mimosa", "$11", "Prosecco · Orange Juice"],
      ["Rossini", "$11", "Prosecco · Strawberry"],
      ["Aperol Spritz", "$13", "Prosecco · Aperol · Soda"],
      ["French 75", "$15", "Prosecco · Gin · Lemon · Simple Syrup"],
    ]),
    category("beer-cider-seltzer", "Beer, cider & seltzer", "", [
      ["White Claw · Black Cherry", "$4", "Seltzer"],
      ["Modelo · Especial", "$5", "Lager"],
      ["Chelada", "$7", "Modelo · Lime · Salt"],
      ["Hudson North · Big Apple Cider", "$6", ""],
      ["KCBC · Superhero Sidekicks", "$7", "Hazy IPA"],
      ["Back Home · Sumac Gose", "$8", "Tart Cherry"],
      ["Allagash · White", "$8", "Belgian-style Wheat"],
    ]),
    category("wine", "Wine by the glass", "", [
      ["Vigna Madre Kriya", "$8", "Red · Montepulciano · Italy"],
      ["Bernardus", "$9", "Red · Pinot Noir · Santa Lucia Highlands · 2023"],
      [
        "Gérard Bertrand · Naturae",
        "$10",
        "Red · Cabernet Sauvignon · France · 2024",
      ],
      ["Oyster Bay", "$9", "White · Sauvignon Blanc · New Zealand"],
      [
        "Cave de Lugny Mâcon-Villages",
        "$9",
        "White · Chardonnay · France · 2023",
      ],
      ["Viña Echeverría · No Es Pituko", "$11", "Orange · Chile"],
      ["Josh Scott · Bla Bla Bla", "$8", "Rosé · New Zealand · 2022"],
      ["Maschio DOC Treviso Brut", "$10", "Sparkling · Prosecco · Italy"],
    ]),
    category("highballs", "Highballs", "", [
      [
        "Well spirit + mixer",
        "$11",
        "Spirit: Gin · Rum · Tequila · Vodka · Whiskey\nMixer: Club Soda · Tonic · Lemon/Sour · Ginger Ale · Cranberry · Cola · Sugar-Free Cola · Red Bull · Red Bull Sugar-Free",
      ],
    ]),
    category(
      "shots",
      "Shots, neat & rocks",
      "Ask about premium spirit pricing.",
      [
        ["Well shot", "$7", "1.5 oz"],
        ["Well neat or rocks", "$9", "2 oz"],
      ],
    ),
    category("zero-proof", "Zero proof", "", [
      ["Athletic · Free Wave", "$6", "Hazy IPA"],
      ["Athletic · Fruited Fields", "$6", "Radler"],
      ["Mocktails", "$8", ""],
    ]),
    category("sodas-juices", "Sodas & juices", "", [
      ["Drink Palestina", "$3", "Cola · Sugar-Free Cola · Orange · Lemon-Lime"],
      ["Red Bull", "$4", "Original · Sugar-Free"],
      ["Ginger Beer", "$3", ""],
      [
        "Juices",
        "$3",
        "Pineapple · Orange · Cranberry · Lemonade · Strawberry Lemonade",
      ],
    ]),
    category(
      "coffee",
      "Coffee",
      "Hot · 12 oz / Iced · 16 oz\nOat or almond milk +$1. Syrups +$0.50: Vanilla · Hazelnut · Honey. Sugar-free: French Vanilla · Hazelnut.",
      [
        ["Espresso", "$4", "Double +$2"],
        ["Americano", "$4", ""],
        ["Macchiato", "$4", ""],
        ["Cortado", "$4", ""],
        ["Flat White", "$5", "Hot or iced"],
        ["Cappuccino", "$5", "Hot or iced"],
        ["Latte", "$5", "Hot or iced"],
        ["Cold Brew", "$5", ""],
        ["Pour Over", "$6", ""],
        ["Specialty Coffee", "$8", ""],
      ],
    ),
  ],
};
