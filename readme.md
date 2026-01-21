
# 🔗 URL Logic: Hashes & Queries

This site uses dynamic URL routing to change the UI (background colors and prompt text) without needing a backend. This allows for specific "game modes" (like *Ship Me* or *3 Words*) just by changing the link.

## 1. Hashes (`#`) - Presets

The **Hash** is used to trigger specific themes defined in the `prompts` object in the code.

| Hash | Mode Name | Description / Prompt |
| :---: | :---: | --- |
| *(None)* | Q | "send me anonymous messages!" |
| `#confession` | Confession | "send me anonymous confessions" |
| `#neverhave` | Never Have | "send me a never have I ever..." |
| `#3words` | 3 Words | "describe me in 3 words, anonymously" |
| `#tbh` | TBH | "If you could change anything about me..." |
| `#shipme` | Ship Me | "who would you ship me with?" |
| `#yourcrush` | Your Crush | "tell me who your crush is, anonymously 🤫" |
| `#cancelled` | Cancelled | "share an opinion that'll get you cancelled" |
| `#dealbreaker` | Deal Breaker | "they're a 10 but..." |

**Example Link:** `https://benz-ngl.github.io/#confessions`

---

## 2. Query Parameters (`?`) - Custom Overrides

Queries allow you to manually override the UI. These are processed **after** the hash, meaning they have a higher priority. Use `_` for spaces.

| Parameter | Key | Function |
| --- | :---: | --- |
| **Question** | `q` | Changes the main prompt text (e.g., `What's ur ick?`). |
| **Tag** | `t` | Sets an internal tag name (e.g., `ICK`). |
| **Style** | `s` | Injects custom CSS (e.g., `background: red;`). |

**Example Link:** `https://benz-ngl.github.io/?t=ICK&q=What's_ur_ick?`

### Example of a fully custom link:

`https://benz-ngl.github.io/?t=ICK&q=What's_ur_ick?#tbh`
