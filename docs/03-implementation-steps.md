\# Plik 1\. Instrukcja dla Agenta AI (Specyfikacja Techniczna)

Poniższy tekst jest przeznaczony bezpośrednio do wklejenia w narzędzia AI (np. Cursor, GitHub Copilot) w celu wygenerowania kodu i struktury aplikacji.

\#\# KROK 0: Główny Szkielet Aplikacji (App Shell) i Zarządzanie Danymi  
Jako ekspert React, UI/UX oraz inżynierii frontendowej, stwórz główny układ (layout) profesjonalnej aplikacji inżynierskiej HVAC. Interfejs musi być zoptymalizowany pod ekrany desktopowe, działać jak oprogramowanie CAD w chmurze i zapewniać pancerne bezpieczeństwo danych.

\* \*\*Wytyczne Wizualne (Design System):\*\* Użyj frameworka React \+ TailwindCSS. Wymuś \`dark mode\`, używając chłodnych, ciemnych barw (np. \`bg-slate-900\` dla głównego tła, \`bg-slate-800\` dla paneli).  
\* \*\*Kolory Semantyczne HVAC:\*\* Zdefiniuj globalne zmienne/klasy: Nawiew (\`blue-500\`), Wyciąg (\`rose-500\` lub \`orange-500\`), Sukces/Zbilansowane (\`green-500\`), Błąd/Alert (\`red-500\`).  
\* \*\*Typografia:\*\* Zastosuj czcionkę bezszeryfową (np. 'Inter') dla UI. Wymuś czcionkę \`monospace\` dla wszystkich tabelarycznych wartości numerycznych i bilansów.  
\* \*\*Architektura Interfejsu:\*\* Zbuduj pełnoekranowy układ (\`h-screen\`, \`w-screen\`, \`overflow-hidden\`), podzielony na 5 stref.  
\* \*\*Strefa 1 \- TopBar (Wysokość: \~56px):\*\* Z lewej edytowalna nazwa projektu (input). Na środku przełącznik (Tabs/Toggle) nawigujący między: "Tabela Bilansu" (Krok 1\) oraz "Obszar Roboczy CAD" (Krok 2/3). Z prawej wskaźnik statusu zapisu w chmurze, przycisk 'Utwórz Wersję', menu eksportu i profil użytkownika.  
\* \*\*Strefa 2 \- LeftSidebar (Szerokość: \~240px):\*\* Kolumna z opcją zwijania do ikon na menu nawigacyjne, filtry bilansu lub bibliotekę elementów CAD.  
\* \*\*Strefa 3 \- RightDrawer:\*\* Wysuwany z prawej strony panel kontekstowy, domyślnie ukryty, sterowany globalnym stanem (np. \`useUIStore.isRightDrawerOpen\`). Renderuje właściwości klikniętego elementu.  
\* \*\*Strefa 4 \- MainViewport:\*\* Reszta przestrzeni (\`flex-1\`) renderująca Tabelę lub Canvas. Musi posiadać własne \`overflow-auto\`, aby panele boczne i paski zostawały na swoich miejscach.  
\* \*\*Strefa 5 \- StatusBar (Wysokość: \~32px):\*\* Dół ekranu wyświetlający globalny alert bilansowy oraz miejsce na przyszłe współrzędne myszy i skalę rysunku.  
\* \*\*Zarządzanie Stanem \- Local Cache:\*\* Użyj middleware \`persist\` z biblioteki \`zustand\` oraz \`IndexedDB\` (\`idb-keyval\`), aby automatycznie zapisywać każdą zmianę stanu lokalnie na wypadek crashu przeglądarki.  
\* \*\*Zarządzanie Stanem \- Cloud Sync:\*\* Główna tabela w Supabase: \`Projects\` (id, user\_id, name, project\_data JSONB). Użyj \`lodash.debounce\` (np. 3000ms), aby po każdej zmianie wysyłać zaktualizowany obiekt do Supabase w tle i aktualizować ikonę w TopBar ("Saving..." \-\> "Saved").  
\* \*\*Zarządzanie Stanem \- Hard Backup:\*\* Przycisk 'Pobierz Backup na Dysk' zrzuca stan z Zustand do JSON i wymusza pobranie pliku \`.hvac\`. Przycisk 'Wczytaj z Dysku' parsuje JSON, weryfikuje strukturę (schemat \`zod\`) i nadpisuje całkowicie główny stan.  
\* \*\*System Kontroli Wersji:\*\* Tabela w bazie \`Project\_Versions\` (id, project\_id, version\_name, commit\_message, created\_at, state\_data JSONB). Przycisk 'Utwórz Wersję' otwiera modal (react-hook-form) i wysyła obecny zrzut do tabeli. Panel boczny wyświetla listę wersji, a przycisk 'Przywróć tę wersję' ładuje \`state\_data\` wybranej rewizji z chmury do stanu aplikacji.

\#\# KROK 1: Moduł Bilansu Powietrza (Air Balance Module)  
Stwórz moduł działający jak zaawansowany arkusz kalkulacyjny, szybki i skalowalny, używając React, TypeScript, TailwindCSS (Dark Mode) oraz \`zustand\` do stanu globalnego.

\* \*\*Biblioteki:\*\* \`ag-Grid\` (wersja Community) lub \`MUI DataGrid\` (wymagana edycja inline i nawigacja klawiaturą), \`react-hook-form\` \+ \`zod\` do formularzy, \`papaparse\` i \`xlsx\` do plików, oraz \`psychrolib\` do termodynamiki (ustawione na SI).  
\* \*\*Architektura Stanu (\`useBalanceStore\`):\*\* Tablica \`floors\` (id, name), zawierająca tablice \`rooms\`.  
\* \*\*Interfejs \`Room\`:\*\* Pola: \`id\`, \`number\`, \`name\`, \`type\` (enum z typami pomieszczeń), \`length\`, \`width\`, \`height\`, \`area\`, \`volume\`, \`supplySystem\`, \`exhaustSystem\`, \`peopleCount\`, \`airPerPerson\` (domyślnie 30), \`airChangeRate\`.  
\* \*\*Interfejs \`Room\` (Ciąg dalszy):\*\* \`wcCount\`, \`showerCount\`, \`urinalCount\`, \`totalHeatGainsW\`, \`roomTemp\` (24), \`roomRH\` (50), \`supplyTemp\` (16), \`supplyRH\` (60), \`kitchenAppliances\` (placeholder VDI 2052).  
\* \*\*Interfejs \`Room\` \- Wyniki:\*\* \`finalSupply\`, \`finalExhaust\`, \`actualAchSupply\`, \`actualAchExhaust\` (WYJŚCIE: finalSupply/volume oraz finalExhaust/volume), \`isManuallyOverridden\`, \`customData\`.  
\* \*\*Akcje stanu:\*\* \`addRoom(floorId, roomData)\` oraz \`updateRoomArea(roomId, newArea)\` aktualizująca powierzchnię, kubaturę i wymuszająca re-kalkulację.  
\* \*\*Puste Stany (Onboarding):\*\* Przy pustej tabeli wyświetl: Import z pliku (modal Data Mapper), Kreator Pomieszczenia (react-hook-form) oraz Szybki Generator Domu (stepper).  
\* \*\*Główny Interfejs:\*\* Zakładki dla każdego \`floor\` z edycją inline w \`ag-Grid\` oraz zakładka 'Podsumowanie'. Dodaj dwie kolumny "Read-Only" dla \`actualAchSupply\` i \`actualAchExhaust\` oraz 'Column Chooser'.  
\* \*\*Kalkulator Pomieszczenia (Drawer):\*\* Wybieraj najwyższą z wartości dla nawiewu/wyciągu na podstawie: ilości osób, krotności wejściowej, przyborów sanitarnych, normatywu z \`type\` lub zysków ciepła (obliczenie wydatku na podstawie entalpii z \`psychrolib\`: $(totalHeatGainsW \\cdot 3.6) / (1.2 \\cdot (h\_p \- h\_n))$).  
\* \*\*Wyjątek dla Kuchni:\*\* Jeśli \`type \=== 'Kuchnia\_Zawodowa'\`, ukryj asymilację zysków, pokaż baner o module VDI 2052 i zostaw ręczny wpis wydatku.  
\* \*\*Zakładka Podsumowanie:\*\* Wygeneruj całkowity bilans budynku, baner alertu (zielony/czerwony/pomarańczowy) oraz tabele grupujące wg systemów.  
\* \*\*Eksport Danych:\*\* Dropdown (biblioteka \`xlsx\`) z opcjami eksportu bieżącej kondygnacji, całego budynku i zestawienia systemów. Wszystkie eksporty muszą zawierać wyliczone kolumny \`actualAchSupply\` i \`actualAchExhaust\`.

\#\# KROK 2: Obszar Roboczy, Import Podkładów i Skalowanie  
Zbuduj zaawansowany moduł Canvas używając \`react-konva\`, \`pdfjs-dist\` (PDF), \`dxf-parser\` (DXF) i \`zustand\` (\`useCanvasStore\`).

\* \*\*Architektura Stanu (Multi-Floor):\*\* Stwórz obiekt \`floorsData: Record\<string, FloorCanvasState\>\` (klucz to \`floorId\`) oraz \`activeFloorId\` w store.  
\* \*\*Interfejs \`FloorCanvasState\`:\*\* \`backgroundImage\`, \`backgroundOpacity\`, \`scaleMultiplier\`, \`originOffset\` (wektor dla układu 0,0), \`cameraPosition\`, \`dxfEntities\`, \`dxfLayers\` oraz baza przejściowa \`unmappedZones\`.  
\* \*\*Silnik Nawigacji:\*\* Użyj tylko jednego komponentu \`\<Stage\>\` renderującego dane z \`activeFloorId\`. Pasek zakładek zmienia \`activeFloorId\`. Zaimplementuj zoom do kursora myszy i przeciąganie płótna (Pan).  
\* \*\*Układ Odniesienia (0,0):\*\* Narzędzie pozwala kliknąć punkt referencyjny na Canvasie i zapisać go do \`originOffset\`. Stwórz funkcje translacji \`toLocalCoords\` i \`toAbsoluteCoords\`. Zapisuj do bazy przez \`toLocalCoords\`, renderuj przez \`toAbsoluteCoords\`.  
\* \*\*Import Rastrów i PDF:\*\* Dropzone wgrywa pliki do aktywnego \`floorId\`. Renderuj PDF z wysoką rozdzielczością przez ukryty canvas i wstaw na warstwę tła z suwakiem krycia.  
\* \*\*Inteligentny Import DXF:\*\* Przeparsuj DXF, otwórz modal menedżera (widoczność warstw, jednostka, ekstrakcja obrysów pokoi). Wylicz powierzchnię w m², przekonwertuj punkty i zapisz do \`unmappedZones\`, renderując jako szare, półprzezroczyste poligony.  
\* \*\*Kalibracja Skali:\*\* Narzędzie linijki do kliknięcia 2 punktów, obliczenia pikseli i zapisania \`scaleMultiplier\`.

\#\# KROK 3: Mapowanie Przestrzeni i Rysowanie Stref (Poligony)  
Zaimplementuj moduł łączący dane bilansu z obiektami graficznymi.

\* \*\*Zależności Stanu:\*\* Dodaj flagę \`isAreaLinkedToGeometry\` do \`Room\` oraz tablicę \`mappedZones\` do \`FloorCanvasState\`. Dodaj stan narzędzia \`activeTool\` ('SELECT', 'DRAW\_POLYGON', 'LINK\_ZONE').  
\* \*\*Rozszerzenie Akustyczne (\`Room\`):\*\* Dodaj \`acousticAbsorption\` ('HARD' | 'MEDIUM' | 'SOFT') oraz \`maxAllowedDbA\`. Zaimplementuj słownik mapowania domyślnych parametrów bazujących na typie pomieszczenia (np. Sypialnia \= SOFT, 30; Biuro \= MEDIUM, 35; Łazienka \= HARD, 45). Umożliw nadpisywanie w panelu właściwości.  
\* \*\*Menedżer Pokoi (Lewy Panel):\*\* Filtruj pokoje po \`activeFloorId\`. Wyświetlaj status wizualny (⚠️ dla braku obrysu, ✅ dla zmapowanego) oraz Zamek Powierzchni (🔒/🔗) blokujący przeliczanie metrażu. Kliknięcie ustawia \`activeRoomId\`.  
\* \*\*Tryb 1 (LINK\_ZONE):\*\* Kliknięcie w szary poligon z \`unmappedZones\` oblicza pole i centroid. Wyświetl modal o aktualizacji metrażu, zaktualizuj stan odpowiednio i przenieś do \`mappedZones\`.  
\* \*\*Tryb 2 (DRAW\_POLYGON):\*\* Ręczne rysowanie poligonu punkt po punkcie (punkty przez \`toLocalCoords\`) ze snappingiem zamykającym. Po zamknięciu oblicz pole, centroid, pokaż modal i zapisz.  
\* \*\*Wizualizacja i Edycja:\*\* Renderuj \`mappedZones\` przez \`toAbsoluteCoords()\` ze stylizacją zależną od bilansu pokoju. Edycja węzłów aktualizuje powierzchnię w bilansie tylko, gdy powiązanie jest aktywne.  
\* \*\*Smart Tag Builder:\*\* Zbuduj modal konfiguracyjny (react-hook-form) modyfikujący obiekt \`tagSettings\` (co wyświetlać na metce). Renderuj edytowalne metki (Read-Only dla obliczeń) w \`tagPosition\` ze stringiem dynamicznym i aktualizuj pozycję przy przeciąganiu.

\#\# KROK 4: Silnik CAD HVAC, Topologia i Fizyka Płynów  
Zbuduj zaawansowany moduł BIM 2D dla tras wentylacyjnych.

\* \*\*Struktura Danych (\`useDuctStore\`):\*\* Oparta na \`DuctSegment\` (Krawędź: startPt, endPt, elevation, flow, velocity, pressureDrop, kształt, wymiary, izolacja) oraz \`Node\` (Węzeł: FITTING, RISER, EQUIPMENT, TERMINAL).  
\* \*\*Moduł Rysunkowy:\*\* Obsługuje tryby \`SINGLE\_LINE\` oraz \`DOUBLE\_LINE\`. Izolacja zewnętrzna zwiększa Bounding Box (linia przerywana na zewnątrz), wewnętrzna zmniejsza przekrój czynny (wewnątrz).  
\* \*\*Oś Z i Kolizje:\*\* Sortuj węzły po \`elevation\` rosnąco, użyj \`destination-out\` do wycięcia maski (Halo Effect) i dorysowuj uskok pionowy (\`VERTICAL\_DROP\`) przy zmianie rzędnej.  
\* \*\*Piony (Risers):\*\* Piony UP i DOWN na kondygnacjach są zablokowane i sparowane. Wdroż system \`Visual Offset\` (\`localOffsetX\`, \`localOffsetY\`) do manualnego korygowania symbolu ignorowanego w fizyce.  
\* \*\*Topologia Sieci:\*\* Niezależność wektora rysowania od wektora aerodynamicznego \- program sam dedukuje przepływ po podłączeniu elementu końcowego lub z portu \`AHUNode\`. Detekcja magistrali (\`MAIN\_TRUNK\`) szuka kątów bliskich 180° na trójnikach. Asymetryczne wyrównanie przesuwa wektor osi logicznej.  
\* \*\*Urządzenia i Elementy Liniowe:\*\* Terminale mają zintegrowaną przepustnicę. Okapy posiadają konfigurator wielu króćców. Wstawianie \`DAMPER\` (ζ \= 0.3), \`FIRE\_DAMPER\` oraz \`SILENCER\` (zmniejsza przekrój i obcina widmo) wprost na przewody.  
\* \*\*Silnik Fizyczny (Auto-Sizer):\*\* Oblicza Liczbę Reynoldsa i współczynnik tarcia zależnie od chropowatości. Pętla auto-Sizera dobiera znormalizowane wymiary kontrolując, by prędkość i opór (R) nie przekroczyły wartości granicznych. Wdroż ochronę przestrzeni (uwzględnia gabaryt zewnętrzny z izolacją), wyrzucając błąd \`EXCEEDS\_LIMITS\`.  
\* \*\*Ścieżka Krytyczna i Bilansowanie:\*\* Wykorzystaj Critical Path DFS od Centrali, sumując liniowe i miejscowe spadki ciśnień (ΔP). Najwyższy spadek określa wymagany spręż dla AHU. Na krótszych gałęziach oblicz nadmiar i przypisz \`requiredThrottling\` do obiektu \`DAMPER\` lub \`AirTerminal\`, w przeciwnym razie generuj ostrzeżenie.

\#\# KROK 5: Generator Schematów i Izometrii  
Transformuj DAG z Kroku 4 na dwa oddzielne widoki.

\* \*\*Zarządzanie Danymi:\*\* Węzły posiadają określony \`systemId\` i \`ahuId\`.  
\* \*\*Tryb A (Schemat Rozwinięty):\*\* Filtruj dla TYLKO JEDNEGO systemu z osiągnięciem czytelności regulacyjnej. Użyj np. \`dagre.js\` układając węzły w równych odstępach, ignorując długość przewodów. Renderuj pojedyncze grube linie i znormalizowane bloki 2D. Smart Labels generują dane z \`requiredThrottling\`.  
\* \*\*Tryb B (Aksonometria 3D):\*\* Filtruj DLA WIELU systemów (np. cała centrala) do koordynacji przestrzennej. Wykorzystaj równania transformacji izometrycznej (30°) przeliczając \`isoX\` i \`isoY\`. Zachowaj proporcje, piony jako pionowe linie między kondygnacjami i oryginalne kolory.  
\* \*\*Interakcja i Eksport:\*\* Zezwól na kosmetyczne przeciąganie etykiet i węzłów na płótnie. Dodaj eksport do PDF (\`jspdf\`) i wektorowego DXF (\`makerjs\` itp.).

\#\# KROK 6: Silnik Akustyczny i Auto-Sizer Tłumików  
Zbuduj moduł symulacji akustycznej (wytyczne ASHRAE) wyliczający Lw i Lp z auto-doborem tłumików.

\* \*\*Struktura Oktawowa:\*\* Obliczenia na widmie (63 Hz do 8000 Hz) z logarytmicznym sumowaniem/odejmowaniem.  
\* \*\*Propagacja w Sieci (Forward DFS):\*\* Algorytm od Centrali z bazowym Lw odejmuje tłumienie naturalne, odbicia kolan oraz podział na trójnikach logarytmicznie. Odejmij odbicie końcowe z terminala.  
\* \*\*Akustyka Pomieszczenia (Room Effect):\*\* Zsumuj logarytmicznie Lw z terminali pokoju. Przelicz Lw na Lp z użyciem kubatury i chłonności. Zaaplikuj krzywą A do jednej wartości \`finalDbA\`. Jeśli wynik przekracza \`maxAllowedDbA\`, pokój staje się \`AcousticCriticalRoom\` (na czerwono).  
\* \*\*Auto-Sizer Tłumika \- Przekrój:\*\* W trybie \`MATCH\_AHU\` przejmuje wymiar króćca. W trybie \`CONSTANT\_VELOCITY\` poszerza gabaryt pilnując prędkości szczeliny i limitu sufitu. Dodaj logarytmicznie szum regenerowany wyliczony wewnątrz urządzenia.  
\* \*\*Auto-Sizer Tłumika \- Długość:\*\* Program pobiera przekroczenie z najgorszego pokoju i testuje iteracyjnie długości tłumika (600, 900, 1000, 1200, 1500, 2000 mm). Wstawienie tłumika wyzwala re-kalkulację hydraulicznej ścieżki krytycznej z Kroku 4\.

\#\# KROK 7: Generator BOM, Przedmiarów KNR i Eksportu (TXT/XLSX)  
Zbuduj silnik analityczny przypisujący kody KNR i generujący pliki wynikowe.

\* \*\*Zarządzanie Metadanymi:\*\* Grupuj obiekty po \`ahuId\`, \`systemId\`, \`floorId\`, \`phaseId\`. Wylicz powierzchnię (\`area\`), obwód lub średnicę dla przewodów i kształtek.  
\* \*\*Mapowanie KNR:\*\* Wdrażaj stałe słowniki wg norm polskich. Kanały z blachy klasyfikowane do kodów KNR-W 2-17 wg przedziałów obwodu lub średnicy. Izolacje wg KNR 9-16. Elementy nietypowe jako "Analiza własna" z dynamicznym opisem.  
\* \*\*Eksport TXT (TSV):\*\* Płaski plik dla programów kosztorysowych (Norma PRO/Zuzia) z separacją za pomocą tabulatora. Agreguje kody KNR, sumuje \`area\` i \`count\` (sztuki) ze stopką kontrolną.  
\* \*\*Eksport XLSX (Excel):\*\* Grupowanie WBS (np. centrala, piętro, system) renderowane na oddzielnych zakładkach. Generuj drzewo działów (np. Dział 1.1) z wierszem "RAZEM" dla każdego i "PODSUMOWANIE CAŁKOWITE".

\#\# KROK 8: Generator Warstw i Eksport DXF (CAD Translator)  
Zbuduj translator (\`DxfExporter\`) do wektorowego pliku DXF przy użyciu biblioteki np. \`dxf-writer\`.

\* \*\*Layer Taxonomy (Warstwy):\*\* Zaimplementuj system nazewnictwa wg konwencji \`\[BRANŻA\]-\[SYSTEM\]-\[TYP\_OBIEKTU\]\`. Warstwy architektoniczne to m.in. \`A-ARCH-SCIANY\` i \`A-POMIESZCZENIA-OBRYS\`. Dla każdego unikalnego systemu instalacyjnego twórz zautomatyzowane zestawy: \`M-WENT-{systemId}-KANALY\`, \`M-WENT-{systemId}-ARMATURA\`, \`M-WENT-{systemId}-OPISY\`.  
\* \*\*Mapowanie Geometrii:\*\* Przewody renderuj jako \`LINE\` / \`LWPOLYLINE\`. Etykiety tekstowe jako \`MTEXT\` z zachowaniem anchorów. Armaturę i terminale definuj w blokach i wstawiaj przez komendę \`INSERT\` (uwzględniając koordynaty i kąt) na dedykowanej warstwie.  
\* \*\*Interfejs i Filtrowanie:\*\* Dodaj Modal z możliwością decyzji włączenia/wyłączenia warstw architektury i selekcją konkretnych systemów przez listę checkboxów do przetworzenia na plik \`.DXF\` jako Blob.  
