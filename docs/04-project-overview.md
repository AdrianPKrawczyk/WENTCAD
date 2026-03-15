\# Plik 2\. Opis Działania i Logiki Programu (Dokumentacja Projektu)

Ten tekst służy do opisywania architektury aplikacji – tego, jak program działa, wspiera i zabezpiecza pracę inżyniera. Można go wykorzystać do dokumentacji, portfolio i ofert.

\#\# KROK 0: Fundament i Środowisko Pracy  
Krok 0 to fundament, na którym opiera się cała aplikacja, definiujący środowisko pracy użytkownika, ergonomiczną nawigację i pancerne mechanizmy ochrony danych.

\* \*\*Ergonomia i Interfejs:\*\* Aplikacja wykorzystuje stałokomorowy układ (przewija się tylko centralny obszar roboczy), z domyślnie włączonym ciemnym motywem redukującym zmęczenie wzroku. System używa ustandaryzowanych branżowych kolorów (Nawiew na niebiesko, Wyciąg na czerwono) oraz zawsze widocznego paska stanu bilansu na dole ekranu.  
\* \*\*Trójwarstwowy System Bezpieczeństwa:\*\* Dane są zapisywane trzema niezależnymi ścieżkami. Lokalna poduszka (Auto-Recovery) natychmiast zapamiętuje postęp w ukrytej pamięci przeglądarki na wypadek awarii zasilania. Zapis w chmurze (Supabase) co kilka sekund wysyła dane na bezpieczny serwer w tle. Twardy backup pozwala wyeksportować postęp do pojedynczego, ustrukturyzowanego pliku JSON (rozszerzenie .hvac) i zapisać go na własnym dysku.  
\* \*\*Wehikuł Czasu (Wersjonowanie):\*\* System rozwiązuje problem zmian koncepcji przez wbudowaną kontrolę wersji przypominającą GITA. Kliknięcie "Utwórz Wersję" i nadanie jej nazwy robi pełne "zdjęcie" projektu. Oś czasu pozwala przejrzeć historię rewizji i jednym kliknięciem całkowicie cofnąć wszystkie decyzje projektowe do poprzedniego stanu.

\#\# KROK 1: Moduł Bilansu Powietrza  
Krok 1 to "serce matematyczne", które działa jak nowoczesny arkusz kalkulacyjny podzielony na kondygnacje i stanowi "Jedno Źródło Prawdy".

\* \*\*Szybkie wprowadzanie (Onboarding):\*\* Aplikacja minimalizuje czas wprowadzania danych przez możliwość importu zestawień z Excela, natywne generatory układów dla domów oraz bycie gotową do odbierania parametrów prosto z narysowanych rzutów CAD.  
\* \*\*Silnik Obliczeniowy i Zasada Maximum:\*\* Aplikacja kalkuluje objętości równolegle na cztery sposoby: normatywnie, wg liczby osób/przyborów, termodynamicznie przez wbudowaną psychrometrię przekładającą zyski ciepła na wydatek oraz poprzez ręczne wytyczne. Zawsze wybierana jest największa i najbezpieczniejsza wartość z możliwością jej "ręcznego nadpisania".  
\* \*\*Rzeczywista Analiza Higieniczna:\*\* Moduł na bieżąco dzieli wydatek przez kubaturę w czasie rzeczywistym i prezentuje inżynierowi parametr "Rzeczywistej Krotności Wymian" gotowy np. dla rzeczoznawców Sanepidu.  
\* \*\*Kontrola i Eksport:\*\* "Dashboard" nadzorczy sumuje nawiewy oraz wyciągi dla budynku sygnalizując zbilansowanie kolorami, a gotowe dane są eksportowane jednym kliknięciem do potężnego pliku Excel przygotowanego specjalnie do doboru urządzeń.

\#\# KROK 2: Środowisko CAD i Przygotowanie Podkładów  
Krok 2 to zaawansowana "cyfrowa deska kreślarska" renderująca rzuty architektoniczne do pracy 2D z optymalizacją pod pamięć operacyjną przeglądarki.

\* \*\*Architektura Wielokondygnacyjna:\*\* Aby nie zawiesić komputera gigantycznymi plikami, do karty graficznej renderowane jest w jednej chwili wyłącznie aktualnie edytowane piętro. Każda karta kondygnacji osobno przechowuje swój własny punkt kamery i zbliżenia (Zoom).  
\* \*\*Synchronizacja Pionów (Lokalny Układ Odniesienia):\*\* Problem przesuniętych i niedopasowanych rzutów jest rozwiązywany przez ustanowienie punktu (np. rogu szybu), który zrównuje wszystkie instalacje matematycznie między piętrami – każda rura spuszczona do pionu trafi z ułamkiem milimetra w to samo miejsce.  
\* \*\*Zaawansowany Import DXF:\*\* Użytkownik deaktywuje zbędne warstwy jednym kliknięciem i korzysta z inteligencji programu, który sam znajduje wektorowe pokoje od architekta i oblicza ich wymiary. Pokoje trafiają do wirtualnej "poczekalni", czekając na powiązanie bez duplikowania się w module bilansu.  
\* \*\*Kalibracja Skali:\*\* Dla bezwektorowych plików PDF czy skanów, program kalibruje w locie wymiary – wystarczy narysować jedną linię między znanymi ścianami by nadać systemowi bezbłędny mnożnik wymiarów.

\#\# KROK 3: Mapowanie Przestrzeni i Rysowanie Stref  
Krok 3 łączy świat danych matematycznych ze światem wizualnym, dając "pokojom z Excela" swoje fizyczne obrysy bez utraty danych inżyniera.

\* \*\*Menedżer Pokoi (Lista To-Do):\*\* Przez całą pracę, projektant korzysta z inteligentnie wyfiltrowanej listy powiadamiającej ostrzegawczo na czerwono o nierozrysowanych pomieszczeniach z bilansu na obecnej kondygnacji.  
\* \*\*Elastyczność Mapowania:\*\* Użytkownik podwiązuje na rysunku obrysy wyliczone przez system pod wgrany plik wektorowy DXF jednym kliknięciem lub ręcznie wyklikuje narożniki na płaskich PDF-ach.  
\* \*\*Zamek Powierzchni i Live Sync:\*\* System rozumie skomplikowane kubatury typu poddasza, pozwalając "zablokować kłódką" manualnie wprowadzoną powierzchnię do tabeli i odłączyć ją od logiki z rysunku w tle. Niezablokowane pokoje przesuwane na ekranie na żywo aktualizują metraż, kubaturę i wymogi dla norm systemu. Wypełnienia poligonów reagują kolorystycznie na bilans.  
\* \*\*Smart Tag Builder:\*\* Na środku pokoi generują się inteligentne metki edytowalne co do standardów i zawartości biura (od wymogów przepływu, do przypisania nazwy centrali czy krotności).  
\* \*\*Auto-Mapping Akustyczny:\*\* Program w locie definiuje zaawansowane wymogi hałasu – wpisując sypialnię, aplikacja nakłada limit bardzo rygorystyczny i miękką chłonność fal. Typowa łazienka to twarda chłonność i wyższe dopuszczenie hałasu. Inżynier posiada z boku dedykowany panel "Akustyka" ze słownikiem cech gotowych do zmiany w każdym punkcie czasowym.

\#\# KROK 4: Silnik CAD HVAC, Topologia i Fizyka  
Krok 4 to jądro całego oprogramowania. Tutaj rurarz krzyżuje grafy trasowania, geometrię oraz fizykę przepływów dla w pełni logicznego środowiska BIM 3D zakodowanego w widoku 2D.

\* \*\*Silnik Geometrii i Mijanki:\*\* Pełne renderowanie od pojedynczych osi do dokładnych wielkości prostokątów z efektem "Halo" generującym eleganckie wycięcia pod wirtualne mijanki z uskoki pionowymi w 3D.  
\* \*\*Piony Wentylacyjne i Offsety:\*\* Teleportacja danych między rzutami działa w pełni automatycznie poprzez sprzężenie kanału pięter. Można optycznie przesunąć położenie na uszkodzonym rzucie przez korektę wizualną ignorowaną w fizyce płynów.  
\* \*\*Magistrale i Asymetria Kształtek:\*\* Program rozpoznaje odgałęzienia od głównego rurociągu, licząc wektory ułożenia, a także fizycznie radzi sobie z asymetrycznym zwężeniem dopasowując osie dla spodu rur.  
\* \*\*Izolacje Kanałów:\*\* Domyślnie chowane, izolacje zewnętrzne poszerzają obrys, wykrywając więcej ograniczeń i kolizji na budowie. Izolacje wewnętrzne podnoszą chropowatość kanału pogarszając jego fizykę i docinając jego rozmiar przepływowy.  
\* \*\*Bazy Terminali:\*\* Oprogramowanie zarządza bazą wentylatorów, zintegrowanymi z przepustnicami terminalami, czerpniami oraz generatorem zmultiplikowanych połączeń okapów dla branży gastro.  
\* \*\*Niezależność Wektora i Flow:\*\* Program ma zaprogramowaną zdolność dedukcji, który wektor jest wywiewany, a który dociera do pomieszczenia bez względu jak go narysuje inżynier. Chroni bilans masowy podsumowując wartości w grafie prosto do samego korzenia (centrali).  
\* \*\*Termodynamika i Auto-Sizing:\*\* Obliczanie wymiarów rur i Reynolda podyktowane jest granicą bezpiecznych prędkości, ale nie dopuści na stworzenie niczego, co przebiłoby strop u architekta ograniczając wymiar przez inteligentną ochronę z błędem w razie braku opcji. Każdą rurę inżynier może trwale zablokować dla wyceny na budowie.  
\* \*\*Ścieżka Krytyczna i Balansowanie:\*\* Algorytm w nieskończoność skanuje wszystkie spadki Paskali, włączając terminale końcowe by wypchnąć na światło najgorszy z nich określający moc wentylatora w centrali. W ramach auto-regulacji na mniejszych gałęziach wypisze "Nadmiar ciśnienia" generując od razu gotowe nastawy wymagane do wyregulowania przepustnic instalacji przez podwykonawców.

\#\# KROK 5: Automatyczne Schematy Rozwinięte i Koordynacja Aksonometryczna  
Krok 5 eliminuje z rynku najdłuższy proces inżyniera – rysowanie schematów ręcznie. Używa do tego dwóch, niezależnych i gotowych do druku w terenie modeli wizualnych.

\* \*\*Tryb A (Schemat Rozwinięty):\*\* Widok logiczno-regulacyjny, dedykowany czytelności jednego urządzenia/systemu. Aplikacja rozkłada instalację jako prostą i rozgałęziającą się drogę ignorując nieistotne długości rur dla doskonałości graficznej na papierze. Ponadto osadza od razu znormalizowane symbole CAD i wybitne parametry regulacji dławienia dla pomiarowca.  
\* \*\*Tryb B (Izometria/Aksonometria 3D):\*\* Skupia uwagę instalatorów do podwieszania rur na budowie z włączonymi wszelkimi systemami nawiewu i czerpni z jednego agregatu jednocześnie. W pełnych wymiarach koordynacyjnych pod kątem 3D rysuje wysokości, przenikania pionów pięter z wyrazistymi kolorami instalacyjnymi ułatwiając detekcję kolizji. Każdy obrys i etykietę modyfikuje i eksportuje z tego miejsca inżynier np. wektorowo poprzez DXF/PDF.

\#\# KROK 6: Zaawansowana Analiza Akustyczna i Generatywny Dobór Tłumików  
Moduł likwidujący wymóg zewnętrznych arkuszy kalkulacyjnych – innowacyjny silnik akustyczny wbudowany do środka projektowania operujący na logarytmach i ASHRAE.

\* \*\*Symulacja Tłumienia Sieci i Odbić:\*\* Od momentu uruchomienia agregatu na dachu oprogramowanie uwzględnia drgania po przewodach we wszystkich pasmach od 63 do 8000 Hz, traci dźwięk odbiciami w każdym kolanie systemu czy ucięciu rury terminala.  
\* \*\*Akustyka Pomieszczenia i dB(A):\*\* Mając wyliczone sumy, spina je automatycznie z architekturą i chłonnością pokoi (krok 3\) po czym logarytmicznie zwraca jako końcowy odgłos trafiający w bębenek człowieka. Jeśli wyciągnie z niego przekroczony wynik normatywny pokój podświetla się priorytetowo na rzucie jako czerwony alarm.  
\* \*\*Automatyczny Dobór Tłumików:\*\* Wobec krytycznego rzutu, inżynier zleca pracę systemowi. Sam dobiera na najkrótszej (najtańszej) długości tłumik tłumiący do poziomu wpadającego bezpiecznie w uszy użytkownika lokalu. Ponadto wymiaruje samo pole rury – generując redukcje z bezpieczną prędkością tak aby uniknąć piszczenia urządzenia od przeciągu przepływowego powietrza na wietrze (ochrona szumu regenerowanego).

\#\# KROK 7: Automatyczny Przedmiar Robót, Generowanie BOM i Integracja Kosztorysowa  
Potężny silnik analityczny przekuwający wektorowy rysunek prosto na zakupy i logistykę na budowach z wbudowanym językiem programów wyceniających na terytorium Polski.

\* \*\*Klasyfikatory KNR:\*\* Algorytm doskonale orientuje się jak przydzielać kategoryzację, sam przypisuje odpowiednie izolacje i rury bazując na ich średnicy do katalogów np. KNR-W 2-17.  
\* \*\*Bezpośredni Zrzut do Normy PRO:\*\* Likwiduje żmudne kopiowanie wyników, wypuszczając gotowy płaski plik tekstowy (.txt), który kosztorysant w ułamek sekundy importuje przez program z przypisaniem nawet nietypowej "Analizy własnej" na trudne urządzenia ppoż.  
\* \*\*Grupowanie Logistyczne (WBS):\*\* Generuje wielowarstwowe zestawienie Excel dla Project Managerów – poszatkowane na piętra, poszczególne urządzenia czy nawiew i wywiew do wpięcia pod konkretną partię prac do zamówienia i posumowania u producentów z idealnie przypisanymi nagłówkami.

\#\# KROK 8: Profesjonalny Eksport DXF i Inteligentny Menadżer Warstw  
Idealna integracja tradycyjnego rysowania dla środowisk AutoCad/BricsCad gdzie instalacje na płasko muszą posiadać archaiczny układ pliku, z którego nadal korzysta biznes budowlany.

\* \*\*Wbudowany Layer Manager:\*\* Każdy wprowadzony moduł czy kanał podlega absolutnie perfekcyjnej kategoryzacji – nie wszystko "spada do jednego worka". Oprogramowanie nazywa warstwy dynamicznie (np. dla nawiewu robi nową nazwę warstwy).  
\* \*\*Plot-Ready (Separacja Wymiaru):\*\* Rozdziela rygorystycznie geometrie rur pod gruby pisak w druku po odseparowane w innym pliku cienko rysowane teksty do ploterów (CTB) by podkład i układ był klarowny przed wysłaniem na deski projektowe inwestycji.  
\* \*\*Zarządzanie Blokami:\*\* Eksport dba o nie wysyłanie miliona niezgrupowanych linii. Centralę czy tłumik wypuszcza pod znormalizowanym, klikalnym obiektem (Bloczkiem CAD). Inżynier, włączając plik, widzi czystą koordynację bez wywiewu nałożoną tylko dla jednego widoku do zatwierdzenia pod nadzór klienta w panelu dialogowym przed finalnym renderem.  
