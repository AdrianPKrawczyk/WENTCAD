# ALGORYTM OBLICZANIA ZYSKÓW CIEPŁA PRZEZ PRZEGRODY PRZEZROCZYSTE

## 1. CEL MODUŁU
Obliczenie całkowitych zysków ciepła ($Q_S$) w danym kroku czasowym (np. co godzinę), na które składają się zyski z przenikania ($Q_P$) oraz zyski z promieniowania słonecznego ($Q_R$) [1].

## 2. ZMIENNE WEJŚCIOWE (INPUTS)

### 2.1. Zmienne dynamiczne (pobierane z plików TRM w pętli czasowej)
*   `t_z` - chwilowa temperatura powietrza zewnętrznego [°C] [2].
*   `I_c` / `I_c_max` - chwilowe / maksymalne w danym miesiącu natężenie promieniowania słonecznego całkowitego dla danej ekspozycji [W/m²] [3].
*   `I_r` / `I_r_max` - chwilowe / maksymalne w danym miesiącu natężenie promieniowania słonecznego rozproszonego [W/m²] [3].
*   `h` - wysokość słońca [°] [4].
*   `B` - azymut słońca [°] [4].

### 2.2. Parametry stałe (konfiguracja pomieszczenia i okna)
*   `t_p` - chwilowa / zadana temperatura powietrza w pomieszczeniu [°C] [2].
*   `A_O` - całkowita powierzchnia okna w świetle muru [m²] [2].
*   `U_O` - współczynnik przenikania ciepła okna [W/(m²·K)] [2].
*   `S` - azymut ściany (np. N=0°, E=90°, S=180°, W=270°) [4, 5].
*   `Phi_1` ($\Phi_1$) - udział powierzchni szkła w powierzchni okna [3].
*   `Phi_2` ($\Phi_2$) - współczynnik przepuszczalności promieniowania słonecznego (uwzględnia rodzaj oszklenia i osłony przeciwsłoneczne) [3].
*   `klimatyzacja` - flaga logiczna (TRUE dla pomieszczeń klimatyzowanych o stałej temp., FALSE dla braku klimatyzacji) [4].
*   `g` - względna masa budynku [kg/m²] [6, 7].

---

## 3. PROCEDURA OBLICZENIOWA (KROK PO KROKU)

### KROK 1: Obliczenie zysków ciepła z przenikania ($Q_P$)
Dla każdego kroku czasowego wykonaj obliczenie różnicy temperatur:
**$Q_P = A_O \cdot U_O \cdot (t_z - t_p)$ [W]** [2]

### KROK 2: Analiza zacienienia i wyznaczenie powierzchni nasłonecznionej ($A_S$)
1.  Oblicz kąt padania promieni słonecznych ($\beta$): 
    **$\beta = B - S$** [8]
2.  Sprawdź warunek nasłonecznienia: 
    Jeżeli **$-90^\circ < \beta < +90^\circ$**, przegroda jest nasłoneczniona [4].
3.  Oblicz nasłonecznioną powierzchnię okna w świetle muru ($A_S$) na podstawie geometrii okna, kąta $\beta$, wysokości słońca ($h$) oraz ewentualnych stałych osłon (np. gzymsy, markizy) [4]. Jeśli brak stałych osłon ograniczających, $A_S = A_O$.

### KROK 3: Wyznaczenie współczynnika akumulacji ciepła ($\Phi_3$)
Współczynnik ten zależy od typu konstrukcji przegród [7].
Jeżeli nie podano wprost pojemności cieplnej, oblicz względną masę budynku ($g$):
**$g = \frac{\sum (F_z \cdot g_z) + 0,5 \sum (f \cdot F_w \cdot g_w)}{\sum (F_z + F_w)}$ [kg/m²]** [9]
Gdzie:
*   `F_z`, `F_w` - powierzchnia przegród zewnętrznych/wewnętrznych [m²] [10].
*   `g_z`, `g_w` - masa jednostkowa przegród zewnętrznych/wewnętrznych [kg/m²] [10].
*   `f` - współczynnik korygujący dla rodzaju wykończenia (np. podłoga drewniana: 0,5-0,7; podłoga z dywanem: 0,25-0,35) [10, 11].

Na podstawie $g$, przypisz typ konstrukcji do odczytu $\Phi_3$ (np. z tablic referencyjnych dla danego miesiąca i godziny) [7, 12-14]:
*   Bardzo lekka: $g < 150 \text{ kg/m}^2$ [7].
*   Lekka: $150 \le g \le 300 \text{ kg/m}^2$ [7].
*   Średnia: $300 < g \le 800 \text{ kg/m}^2$ [7].
*   Ciężka: $g > 800 \text{ kg/m}^2$ [7].

### KROK 4: Obliczenie zysków ciepła z promieniowania ($Q_R$)
Mechanizm zależy od wyposażenia pomieszczenia [3, 4]:

**WARIANT A: Pomieszczenie klimatyzowane (stała/kontrolowana temperatura)** [4]
*Użyj wartości maksymalnych promieniowania dla danego miesiąca i zastosuj współczynnik akumulacji:*
**$Q_R = [A_S \cdot I_{c \text{ max}} + (A_O - A_S) \cdot I_{r \text{ max}}] \cdot \Phi_1 \cdot \Phi_2 \cdot \Phi_3$ [W]** [3]

**WARIANT B: Pomieszczenie bez klimatyzacji (niekontrolowana temperatura) LUB konstrukcja bardzo lekka ($g < 100 \text{ kg/m}^2$)** [4]
*Brak uwzględnienia akumulacji ($\Phi_3$), użyj wartości chwilowych promieniowania:*
**$Q_R = [A_S \cdot I_c + (A_O - A_S) \cdot I_r] \cdot \Phi_1 \cdot \Phi_2$ [W]** [3]

### KROK 5: Sumowanie (Wynik końcowy modułu)
Dla danego kroku czasowego zyski sumaryczne wynoszą:
**$Q_S = Q_P + Q_R$ [W]** [1]

---

## 4. UWAGI IMPLEMENTACYJNE DLA SYSTEMU AI
1.  **Dane TRM:** Wartości $I_c$ oraz $I_r$ z plików TRM są zazwyczaj podawane jako chwilowe. Wariancja dla "WARIANTU A" wymaga wcześniejszego sprasowania pliku TRM dla danego miesiąca i kierunku, by odnaleźć lokalne maksima ($I_{c \text{ max}}$, $I_{r \text{ max}}$) [3].
2.  **Kąty:** Należy zadbać o spójność jednostek trygonometrycznych (stopnie vs radiany) w funkcjach wyliczających $A_S$.


# ALGORYTM OBLICZANIA ZYSKÓW CIEPŁA PRZEZ PRZEGRODY NIEPRZEZROCZYSTE

## 1. CEL MODUŁU
Obliczenie chwilowych zysków ciepła ($Q_{sc}$) przenikających do pomieszczenia przez przegrody budowlane nieprzezroczyste (ściany zewnętrzne, stropodachy) w wyniku działania promieniowania słonecznego i różnicy temperatur.

## 2. ZMIENNE WEJŚCIOWE (INPUTS)

### 2.1. Zmienne dynamiczne (agregowane z plików TRM)
*   `t_zsr` - średnia dobowa temperatura powietrza zewnętrznego w danym dniu obliczeniowym [°C]. Wymaga wcześniejszego wyliczenia średniej z 24 wartości godzinowych pliku TRM dla danego dnia.

### 2.2. Parametry stałe (konfiguracja przegrody i pomieszczenia)
*   `t_p` - zakładana temperatura powietrza w pomieszczeniu [°C].
*   `A_sc` - całkowita powierzchnia rozpatrywanej ściany zewnętrznej lub stropodachu [m²].
*   `U_sc` - współczynnik przenikania ciepła ściany zewnętrznej lub stropodachu [W/(m²·K)].
*   `typ_przegrody` - rodzaj przegrody (ściana zewnętrzna / stropodach ocieplony / stropodach nieocieplony).
*   `orientacja` - azymut ściany (N, NE, E, SE, S, SW, W, NW, pozioma).
*   `g_jedn` - jednostkowa masa przegrody [kg/m²].
*   `P` - współczynnik przezroczystości atmosfery (standardowo przyjmuje się P=4; dla stref przemysłowych P=3, dla stref czystych wiejskich/górskich P=5).

### 2.3. Tablice referencyjne (wymagane w bazie danych aplikacji)
*   Tabela bazowych wartości **równoważnej różnicy temperatury ($\Delta t_r$)** - zależna od godziny słonecznej, typu przegrody, orientacji oraz masy jednostkowej.
*   Tabela **współczynników poprawkowych ($\beta$)** - zależna od typu przegrody, jej masy oraz współczynnika przezroczystości atmosfery.
Znajdują się w pliku docs\10-zyski-ciepla-prom.tabelice-referencyjne_2.3.json
---

## 3. PROCEDURA OBLICZENIOWA (KROK PO KROKU)

### KROK 1: Odczyt bazowej równoważnej różnicy temperatury ($\Delta t_r$)
Dla danej godziny obliczeniowej odczytaj z tabel referencyjnych wartość $\Delta t_r$ [K]. 
Wartość tę wybiera się na podstawie:
*   Typu przegrody (ściana / stropodach).
*   Kierunku świata (orientacji).
*   Jednostkowej masy przegrody `g_jedn` (dla wartości pośrednich należy dokonać interpolacji liniowej między np. 100 a 200 kg/m²).

*Uwaga teoretyczna: Tablice bazowe są zdefiniowane dla standardowych warunków: t_p = 26°C, średnia dobowa t_z = 24°C, stałych współczynników absorpcji (0,7 dla ścian, 0,9 dla dachów) oraz przezroczystości atmosfery P=4.*

### KROK 2: Ustalenie współczynnika poprawkowego ($\beta$)
W przypadku gdy atmosfera różni się od standardowej (P=4), odczytaj/oblicz poprawkę $\beta$ [K]:
*   Dla ścian o masie $200 \div 300 \text{ kg/m}^2$: $\beta = +1,5$ (gdy P=3) lub $\beta = -1,5$ (gdy P=5).
*   Dla ścian o masie $500 \div 700 \text{ kg/m}^2$: $\beta = +1,0$ (gdy P=3) lub $\beta = -1,0$ (gdy P=5).
*   Dla stropodachów o masie $50 \div 200 \text{ kg/m}^2$: $\beta = +2,0$ (gdy P=3) lub $\beta = -2,0$ (gdy P=5).
*   Dla stropodachów o masie $300 \div 500 \text{ kg/m}^2$: $\beta = +1,5$ (gdy P=3) lub $\beta = -1,5$ (gdy P=5).
*(Dla P=4 przyjmuje się $\beta = 0$)*.

### KROK 3: Korekta równoważnej różnicy temperatury ($\Delta t_r^s$)
Z racji tego, że rzeczywiste parametry pomieszczenia i klimatu (z TRM) różnią się od założeń tabelarycznych, oblicz skorygowaną równoważną różnicę temperatury dla danego kroku czasowego:
**$\Delta t_r^s = \Delta t_r + (t_{zsr} - 24) + (26 - t_p) + \beta$ [K]**

### KROK 4: Obliczenie zysków ciepła ($Q_{sc}$)
Oblicz finalne zyski ciepła przenikające przez daną przegrodę nieprzezroczystą w danym kroku czasowym:
**$Q_{sc} = A_{sc} \cdot U_{sc} \cdot \Delta t_r^s$ [W]**

---

## 4. UWAGI IMPLEMENTACYJNE DLA SYSTEMU AI
1.  **Baza danych:** Algorytm wymaga zaimplementowania macierzy danych dla $\Delta t_r$ z podręczników wentylacji/klimatyzacji, rozpisanych dla godzin 6:00 - 20:00 (lub pełnej doby) w zależności od orientacji i masy.
2.  **Uśrednianie TRM:** Pliki TRM podają temperaturę dla każdej godziny. Zmienna $t_{zsr}$ w Kroku 3 nie jest temperaturą z danej godziny obliczeniowej, lecz średnią arytmetyczną ze wszystkich 24 godzin danego dnia z pliku TRM. Algorytm przed wejściem w pętlę godzinową musi sprasować dane dla bieżącego dnia i wyliczyć średnią.
3.  **Ograniczenia nocne:** Należy oprogramować zachowanie algorytmu w godzinach nocnych (brak bezpośredniego promieniowania słonecznego) – tablice $\Delta t_r$ uwzględniają przesunięcie fazowe oddawania ciepła zależne od bezwładności cieplnej (masy) budynku.