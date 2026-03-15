\# HVAC\_FORMULAS.md \- Single Source of Truth for Engineering Math

\> \*\*\[CRITICAL SYSTEM DIRECTIVE FOR AI AGENTS\]\*\*  
\> This file contains the ABSOLUTE and ONLY mathematical formulas allowed for physics, thermodynamics, acoustics, and geometry calculations in this project.   
\> DO NOT invent, modify, or search the web for alternative formulas.   
\> Pay strict attention to units (mm vs m, m³/h vs m³/s, Pa, W). All base inputs from the UI are typically in mm and m³/h, but physics equations require SI base units (m, m/s).

\---

\#\# 1\. STAŁE FIZYCZNE (PHYSICAL CONSTANTS)  
Używaj tych stałych we wszystkich modułach przeliczeniowych.  
\- Gęstość powietrza (Standard Air Density): $\\rho \= 1.2 \\text{ kg/m}^3$  
\- Ciepło właściwe powietrza: $c\_p \= 1005 \\text{ J/(kg\\cdot K)}$ lub w uproszczeniu inżynierskim dla entalpii używamy stałej $0.34$ dla $W \\rightarrow m^3/h$.  
\- Lepkość kinematyczna powietrza (Kinematic Viscosity at 20°C): $\\nu \= 1.5 \\cdot 10^{-5} \\text{ m}^2\\text{/s}$

\---

\#\# 2\. KROK 1: BILANSOWANIE I TERMODYNAMIKA (AIR BALANCE)

\#\#\# 2.1. Zapotrzebowanie Powietrza (Zasada Maximum)  
Dla każdego pomieszczenia wydatek końcowy $V\_{final}$ \[$m^3/h$\] to:  
$$V\_{final} \= \\max(V\_{hig}, V\_{krotnosc}, V\_{term}, V\_{norm})$$

Gdzie:  
\- \*\*Higieniczne:\*\* $V\_{hig} \= \\text{Liczba\\\_Osob} \\cdot \\text{Dawka\\\_na\\\_osobe}$ \[$m^3/h$\]  
\- \*\*Krotność:\*\* $V\_{krotnosc} \= ACH \\cdot (\\text{Area} \\cdot \\text{Height})$ \[$m^3/h$\]  
\- \*\*Normatywne:\*\* $V\_{norm} \= \\text{Wartosc przypisana z normy dla danego 'type'}$

\#\#\# 2.2. Obliczenia Termodynamiczne (Chłodzenie)  
Zależność między zyskami ciepła a wymaganym strumieniem powietrza nawiewanego.  
Używamy entalpii z biblioteki \`psychrolib\`.

$$V\_{term} \= \\frac{Q\_{total} \\cdot 3.6}{1.2 \\cdot (h\_p \- h\_n)}$$  
Gdzie:  
\- $Q\_{total}$ \= Całkowite zyski ciepła (Jawne \+ Utajone) w Watach \[$W$\].  
\- $h\_p$ \= Entalpia powietrza w pomieszczeniu \[$kJ/kg$\] (wyliczona z \`roomTemp\` i \`roomRH\`).  
\- $h\_n$ \= Entalpia powietrza nawiewanego \[$kJ/kg$\] (wyliczona z \`supplyTemp\` i \`supplyRH\`).

\#\#\# 2.3. Rzeczywista Krotność Wymian (Real ACH)  
$$ACH\_{real} \= \\frac{V\_{final}}{\\text{Area} \\cdot \\text{Height}} \\text{ \[1/h\]}$$

\---

\#\# 3\. KROK 4: AERODYNAMIKA I STRATY CIŚNIENIA (FLUID DYNAMICS)

\> \*\*UWAGA NA JEDNOSTKI:\*\* Wymiary kanałów z UI są w milimetrach \[$mm$\]. Do wzorów aerodynamicznych bezwzględnie konwertuj je na metry \[$m$\] ($D/1000$, $W/1000$, $H/1000$).  
\> Przepływ w UI to \[$m^3/h$\]. Do wzorów zamieniaj na \[$m^3/s$\] dzieląc przez 3600\.

\#\#\# 3.1. Prędkość Powietrza (Air Velocity)  
$$v \= \\frac{V\_{m^3/h}}{3600 \\cdot A\_{cs}} \\text{ \[m/s\]}$$  
Gdzie $A\_{cs}$ to pole przekroju poprzecznego \[$m^2$\]:  
\- Dla kanałów okrągłych: $A\_{cs} \= \\pi \\cdot \\left(\\frac{D}{2}\\right)^2$  
\- Dla kanałów prostokątnych: $A\_{cs} \= W \\cdot H$

\#\#\# 3.2. Średnica Hydrauliczna (Hydraulic Diameter)  
Służy do sprowadzenia kanału prostokątnego do wzorów dla rur okrągłych.  
\- Kanał okrągły: $D\_h \= D$ \[$m$\]  
\- Kanał prostokątny: $D\_h \= \\frac{2 \\cdot W \\cdot H}{W \+ H}$ \[$m$\]

\#\#\# 3.3. Liczba Reynoldsa (Reynolds Number)  
$$Re \= \\frac{v \\cdot D\_h}{\\nu}$$

\#\#\# 3.4. Współczynnik Tarcia (Friction Factor \- $\\lambda$)  
Zamiast wzoru Colebrooka-White'a wymagającego iteracji, \*\*UŻYWAJ aproksymacji Haalanda\*\* (idealna dla kodu JS):  
\- Reżim laminarny ($Re \< 2320$): $\\lambda \= \\frac{64}{Re}$  
\- Reżim turbulentny ($Re \\ge 2320$):   
$$\\frac{1}{\\sqrt{\\lambda}} \= \-1.8 \\cdot \\log\_{10}\\left( \\left(\\frac{k / D\_h}{3.7}\\right)^{1.11} \+ \\frac{6.9}{Re} \\right)$$  
\*(Wylicz $\\lambda$ podnosząc prawą stronę do potęgi \-2)\*  
\- $k$ \= Chropowatość bezwzględna materiału \[$m$\] (np. blacha ocynkowana $k \= 0.00015 \\text{ m}$).

\#\#\# 3.5. Spadek Ciśnienia (Pressure Drop)  
\- \*\*Ciśnienie dynamiczne:\*\* $P\_d \= \\frac{\\rho \\cdot v^2}{2}$ \[$Pa$\]  
\- \*\*Strata liniowa:\*\* $\\Delta p\_{lin} \= \\lambda \\cdot \\frac{L}{D\_h} \\cdot P\_d$ \[$Pa$\]  
\- \*\*Strata miejscowa:\*\* $\\Delta p\_{lok} \= \\zeta \\cdot P\_d$ \[$Pa$\] (Gdzie $\\zeta$ to współczynnik oporu miejscowego kształtki/urządzenia).  
\- \*\*Całkowity opór segmentu:\*\* $\\Delta P\_{seg} \= \\Delta p\_{lin} \+ \\sum \\Delta p\_{lok}$

\#\#\# 3.6. Izolacja Wewnętrzna (Internal Insulation Aerodynamic Impact)  
Jeśli przewód posiada izolację wewnętrzną typu \`INTERNAL\_WOOL\` o grubości $t$ \[$m$\]:  
\- Wymiary aerodynamiczne do wzorów powyżej maleją:  
  $D\_{aero} \= D\_{nom} \- 2t$  
  $W\_{aero} \= W\_{nom} \- 2t$, $H\_{aero} \= H\_{nom} \- 2t$  
\- Chropowatość $k$ rośnie do wartości np. $k \= 0.003 \\text{ m}$ (szkło welonowe).

\---

\#\# 4\. KROK 6: AKUSTYKA (ACOUSTICS & ATTENUATION)

\#\#\# 4.1. Pasma Oktawowe (Octave Bands)  
Wszystkie obliczenia wykonuj na 8-elementowej tablicy (Hz):  
\`\[63, 125, 250, 500, 1000, 2000, 4000, 8000\]\`

\#\#\# 4.2. Sumowanie Logarytmiczne (Logarithmic Addition)  
Zwykłe dodawanie hałasu (np. 2 kratki w jednym pokoju).  
$$L\_{\\Sigma} \= 10 \\cdot \\log\_{10}\\left( \\sum\_{i=1}^{n} 10^{L\_i / 10} \\right) \\text{ \[dB\]}$$

\#\#\# 4.3. Podział Hałasu na Trójnikach (Branch Sound Power Division)  
Kiedy kanał rozdziela się na trójniku, hałas rozkłada się proporcjonalnie do pola przekroju. Tłumienie (spadek) mocy akustycznej idącej w odgałęzienie:  
$$\\Delta L\_{w,branch} \= 10 \\cdot \\log\_{10}\\left(\\frac{A\_{branch}}{A\_{total\\\_out}}\\right) \\text{ \[dB\]}$$  
\*Dodaj tę wartość (będzie ujemna) do widma $L\_{w,in}$.\*

\#\#\# 4.4. Akustyka Pomieszczenia (Room Effect: Lw to Lp)  
Konwersja Poziomu Mocy Akustycznej ($L\_w$ u wylotu kratki) na Poziom Ciśnienia Akustycznego ($L\_p$ słyszalny w pomieszczeniu).  
Używaj uogólnionego wzoru dla pola bezpośredniego i pogłosowego (zakładamy słuchacza w odległości $r \\approx 1.5 \\text{ m}$, współczynnik kierunkowości $Q=2$):

$$L\_p \= L\_w \+ 10 \\cdot \\log\_{10}\\left( \\frac{Q}{4 \\cdot \\pi \\cdot r^2} \+ \\frac{4}{R\_c} \\right)$$

Gdzie Stała Pomieszczenia $R\_c$ \[$m^2$\]:  
$$R\_c \= \\frac{S \\cdot \\bar{\\alpha}}{1 \- \\bar{\\alpha}}$$  
\- $S$ \= Całkowita powierzchnia przegród pokoju \[$m^2$\] (wylicz z: $Area \\times 2 \+ Perimeter \\times Height$).  
\- $\\bar{\\alpha}$ \= Średni współczynnik pochłaniania z \`useZoneStore\` (\`HARD\` \= 0.1, \`MEDIUM\` \= 0.25, \`SOFT\` \= 0.45).

\#\#\# 4.5. Filtracja Krzywą A (A-Weighting)  
Aby przejść z 8 pasm na jedną wartość dB(A), do wyliczonego widma $L\_p$ dodaj wartości z poniższej tablicy, a następnie zsumuj logarytmicznie:  
\`A\_WEIGHTING\_CORRECTIONS \= \[-26.2, \-16.1, \-8.6, \-3.2, 0.0, 1.2, 1.0, \-1.1\]\`

\---

\#\# 5\. KROK 7: GEOMETRIA I PRZEDMIARY (GEOMETRY & BOM)

\> Obliczenia powierzchni do celów KNR (kosztorysowania).

\#\#\# 5.1. Powierzchnia blachy (Duct Surface Area)  
Wartość wyjściowa w \[$m^2$\]. Wejście ($D, W, H, L$) przeliczone na metry.  
\- Okrągłe: $Area \= \\pi \\cdot D \\cdot L$  
\- Prostokątne: $Area \= 2 \\cdot (W \+ H) \\cdot L$

\#\#\# 5.2. Powierzchnia Izolacji Zewnętrznej (External Insulation Area)  
Uwzględnia powiększenie obwodu przez grubość izolacji $t$ \[$m$\].  
\- Okrągłe: $Area\_{iso} \= \\pi \\cdot (D \+ 2t) \\cdot L$  
\- Prostokątne: $Area\_{iso} \= 2 \\cdot (W \+ 2t \+ H \+ 2t) \\cdot L \= 2 \\cdot (W \+ H \+ 4t) \\cdot L$

\#\#\# 5.3. Powierzchnia Izolacji Wewnętrznej (Internal Insulation Area)  
Do kosztorysowania wklejania wełny z welonem do wewnątrz używamy nominalnego obwodu wewnętrznego (równa się powierzchni blachy).  
\- Area \= Duct Surface Area (jak w pkt 5.1).  
