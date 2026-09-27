# VeriTrust AI — Multi-Hue Soft Neumorphic Design System

VeriTrust AI implements a **zone-based, multi-hue soft UI (claymorphism / colored soft neumorphism)** that moves away from monotonous gray palettes while preserving tactile dual-shadow depth and strict WCAG AA contrast.

---

## 🎨 Functional Zone Mapping

| Functional Area | Hue & Base Gradient | Shadow Recipe | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `linear-gradient(135deg, #EEF2F8, #F4F1F9, #FBF8F3)` | N/A (Fixed Ambient) | Warm, multi-hue base canvas that eliminates stark sterile gray |
| **Maker Agent (Chat Feed)** | Periwinkle / Blue-Lavender (`#F2F6FE` $\to$ `#E2ECFA`) | `rgba(165,183,212,0.45)` dual shadows | Generative LLM workspace tone |
| **Judge Agent (Inspection)** | Soft Mint / Seafoam Green (`#F0F8F4` $\to$ `#DCEDE5`) | `rgba(158,192,180,0.45)` dual shadows | Auditing, trust, and verification workspace |
| **Telemetry & Drift** | Lavender / Violet (`#F5F2FB` $\to$ `#E5DCF2`) | `rgba(178,172,208,0.42)` dual shadows | Analytical yet warm data telemetry |
| **Navigation Chrome** | Soft Indigo-Slate (`#E6ECF5` $\to$ `#D8E1ED`) | `6px 0 18px rgba(165,180,205,0.45)` | Anchors side/top chrome from content area |

---

## 🏷️ Verdict Badges & Contrast

All badges use pastel background tints with deep high-contrast text and embossed shadows:
- **Verified / Approved**: Emerald tint (`bg-emerald-50 text-emerald-900 border-emerald-300`)
- **Unsupported / Corrected**: Warm Amber tint (`bg-amber-50 text-amber-900 border-amber-300`)
- **Contradicted / Blocked**: Rose/Coral tint (`bg-rose-50 text-rose-900 border-rose-300`)
