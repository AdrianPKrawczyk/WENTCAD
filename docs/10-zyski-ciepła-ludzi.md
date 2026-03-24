# ALGORYTM OBLICZANIA ZYSKÓW CIEPŁA I WILGOCI OD LUDZI

## 1. CEL MODUŁU
Obliczenie całkowitych zysków ciepła jawnego ($Q_L$) oraz strumienia wydzielanej pary wodnej, czyli zysków wilgoci ($W$), od osób przebywających w analizowanym pomieszczeniu [1, 2].

## 2. ZMIENNE WEJŚCIOWE (INPUTS)

### 2.1. Parametry stałe (konfiguracja pomieszczenia)
* `n` - nominalna liczba osób w pomieszczeniu [2].
* `typ_pomieszczenia` - kategoria pomieszczenia (np. biuro, kino, hotel) służąca do określenia współczynnika jednoczesności przebywania osób [2].
* `aktywnosc` - stopień aktywności fizycznej (mała, średnia, duża / np. odpoczynek siedząc, lekka praca, ciężka praca) [3-6].
* `struktura_osob` - profil użytkowników (mężczyźni, kobiety, dzieci, grupa mieszana) pozwalający na zastosowanie odpowiednich korekt [7].

### 2.2. Zmienne dynamiczne
* `t_p` - chwilowa temperatura powietrza w pomieszczeniu [°C] [3, 4].

---

## 3. PROCEDURA OBLICZENIOWA (KROK PO KROKU)

### KROK 1: Ustalenie współczynnika jednoczesności przebywania ludzi ($\phi$)
Na podstawie przeznaczenia pomieszczenia, system powinien przypisać współczynnik jednoczesności ($\phi$) [2]:
* Biura, duże sale: 0,75 ÷ 0,95 [2].
* Domy towarowe: 0,80 ÷ 0,90 [3].
* Hotele (recepcje), pokoje wieloosobowe: 0,40 ÷ 0,60 [3].
* Pomieszczenia technologiczne: 0,90 ÷ 1,0 [3].
* Teatry, kina, małe pomieszczenia o różnym przeznaczeniu: 1,0 [3].
docs\10-zyski-ciepla-ludzi-tab1.json

### KROK 2: Odczyt bazowych jednostkowych zysków ciepła ($q_{j,baz}$) i wilgoci ($q_{w,baz}$)
Na podstawie bieżącej temperatury powietrza w pomieszczeniu `t_p` (zazwyczaj w zakresie 15°C – 35°C) oraz wybranego stopnia `aktywnosc`, algorytm powinien pobrać z bazy danych następujące wartości:
* `q_j_baz` - ciepło jawne oddawane przez jednego człowieka [W/osobę] [2, 3, 6].
* `q_w_baz` - ilość pary wodnej wytwarzanej przez jednego człowieka [g/(h·osobę)] [2, 4].

*Uwaga: Zaimplementowane w bazie tablice referencyjne standardowo odnoszą się do dorosłych mężczyzn przebywających w środowisku o wilgotności względnej 30÷80% [7].*
docs\10-zyski-ciepla-ludzi-tab2.json - jawne
docs\10-zyski-ciepla-ludzi-tab3.json - wilgoć

### KROK 3: Korekta ze względu na strukturę użytkowników (płeć i wiek)
Pobrane wartości bazowe ($q_{j,baz}$ oraz $q_{w,baz}$) należy skorygować w zależności od profilu grupy docelowej [7]:
* **Grupa mieszana (mężczyźni i kobiety):** pomnóż wartości przez **0,90** (zmniejszenie o 10%) [7].
* **Wyłącznie kobiety:** pomnóż wartości przez **0,80** (zmniejszenie o 20%) [7].
* **Wyłącznie dzieci:** pomnóż wartości przez współczynnik od **0,60 do 0,80** (zmniejszenie o 20÷40% w zależności od wieku dzieci) [7].
* **Wyłącznie mężczyźni:** brak korekty (mnożnik 1,0) [7].

W ten sposób otrzymasz ostateczne, skorygowane wartości $q_j$ oraz $q_w$.

### KROK 4: Obliczenie zysków całkowitych (Wynik końcowy modułu)
Dla danego kroku czasowego oblicz sumaryczne zyski w pomieszczeniu:
1. **Całkowite zyski ciepła jawnego ($Q_L$):** 
   **$Q_L = n \cdot q_j \cdot \phi$ [W]** [2]
2. **Całkowite zyski wilgoci ($W$):** 
   **$W = n \cdot q_w \cdot \phi$ [g/h]** [2]

---

## 4. UWAGI IMPLEMENTACYJNE DLA SYSTEMU AI
1. **Baza tablic:** Agent będzie musiał dysponować wbudowanymi macierzami danych krzyżującymi typ aktywności (np. "odpoczynek w pozycji siedzącej", "bardzo lekka praca fizyczna") z temperaturą powietrza w celu odczytania dokładnych wartości ciepła jawnego i pary wodnej [3-6].
2. **Ujemne wartości:** Przy wysokich temperaturach w pomieszczeniu (np. 35°C), zyski ciepła jawnego ($q_j$) potrafią spadać do 0, a nawet przyjmować wartości ujemne, podczas gdy gwałtownie rosną zyski utajone (wilgoci) wynikające z parowania potu [5, 6]. Należy dopuścić w kodzie takie zachowanie funkcji.