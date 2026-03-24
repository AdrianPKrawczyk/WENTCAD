Obliczenie współczynnika $U$ dla samej płyty betonowej pokazuje, jak ogromne znaczenie ma izolacja termiczna. Beton sam w sobie jest bardzo słabym izolatorem.

Zanim przejdziemy do konkretnych przypadków, obliczmy opór cieplny samej warstwy betonu ($R$):
* Grubość ($d$): **0,24 m**
* Przewodność ($\lambda$): **1,7 W/(m·K)**

$$R = \frac{d}{\lambda} = \frac{0,24}{1,7} \approx 0,141 \text{ (m²·K)/W}$$

Poniżej zestawienie wyników dla różnych wariantów, uwzględniające standardowe opory przejmowania ciepła ($R_{si}$ i $R_{se}$) zgodnie z normą PN-EN ISO 6946.



---

### Zestawienie współczynnika $U$ dla betonu 24 cm

| Typ przegrody | Kierunek strumienia | $R_{si}$ | $R_{se}$ | Suma $R_T$ | **Wynik $U$ [W/(m²·K)]** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ściana zewnętrzna** | Poziomy | 0,13 | 0,04 | 0,311 | **3,22** |
| **Ściana wewnętrzna** | Poziomy | 0,13 | 0,13 | 0,401 | **2,49** |
| **Dach** | W górę | 0,10 | 0,04 | 0,281 | **3,56** |
| **Strop wewnętrzny** | W dół (ogrzewane nad nieogr.) | 0,17 | 0,17 | 0,481 | **2,08** |
| **Podłoga na gruncie** | W dół | 0,17 | 0,00* | 0,311 | **3,22** |

*\*Dla podłóg na gruncie w uproszczonych obliczeniach komponentu przyjmuje się $R_{se} = 0$, ponieważ grunt przylega bezpośrednio do przegrody.*

---

### Kilka ważnych wniosków:

1.  **Rola oporów powierzchniowych:** Zauważ, że dla tak słabego izolatora jak beton, to, czy powietrze "stoi" (strop), czy "wieje" (dach), ma relatywnie duży wpływ na wynik końcowy.
